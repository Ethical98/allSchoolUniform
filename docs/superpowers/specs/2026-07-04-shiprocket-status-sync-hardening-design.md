# ShipRocket Status Sync Hardening — Design

**Date:** 2026-07-04
**Status:** Approved (pending user spec review)

## Problem

Orders delivered on ShipRocket do not reflect as delivered on the admin dashboard.
Investigation found **two independent bugs** that produce the same symptom, plus a
**structural flaw** that makes the system fragile.

### Bug #1 — Assign journey records a success that never happened

`POST /courier/assign/awb` returns **HTTP 200 even on failure** (e.g. insufficient
wallet balance, KYC hold, non-serviceable pincode). The failure is in the response
**body** (`awb_assign_error`), not the HTTP status, so `shippingClient` does not throw.

`createShippingOrder` (single-step block) and `assignCourier` read the empty response,
get `undefined` for the AWB, but still set `order.shipping.status = 'AWB_ASSIGNED'` and
report success to the admin. The order lands in a contradictory dead state:
`status = 'AWB_ASSIGNED'` with **no `awbCode`**. This is what hit order
`ASU20260621-004859` (shown as `AWB: Pending`, courier Amazon Shipping Surface, after
a low-balance window).

Consequence: no shipment exists on ShipRocket, so no delivery webhook is ever fired
for it, and the manual track endpoint hard-throws (`"No AWB code assigned"`) — the
order can never reach `Delivered`.

### Bug #2 — Returns webhook handler swallows forward deliveries

The returns push (commits f650e88, 1737c17 on 2026-05-23; 3d363d8 on 2026-06-02)
inserted `handleReverseWebhook` at the **top** of the webhook, *before* the forward-order
logic. It early-exits (`type: 'reverse'`) whenever the webhook AWB matches a non-terminal
`ReturnRequest.reverseShipping.awbCode`.

ShipRocket status codes collide between forward and reverse meanings:

| Code | Forward meaning | Reverse meaning (REVERSE_STATUS_MAP) |
|:----:|-----------------|--------------------------------------|
| 7    | **Delivered**   | RECEIVED (since 2026-05-23)          |
| 6    | Shipped         | IN_TRANSIT                           |
| 9    | NDR             | IN_TRANSIT                           |
| 17   | **Out for Delivery** | CANCELLED (**added 2026-06-02**)|
| 16   | —               | CANCELLED (added 2026-06-02)         |

If a forward order's AWB ever coincides with an open return's `reverseShipping.awbCode`,
the forward delivery webhook (code 7) is consumed as "return RECEIVED" and the forward
order's `tracking.isDelivered` is never set. The 2026-06-02 addition of codes 16/17
widened the blast radius. This is a genuine regression from the returns push and affects
a **different** set of orders than Bug #1 — ones that shipped with a real AWB but show
stuck-in-transit while ShipRocket says delivered.

### Structural flaw — no single source of truth for status mapping

The webhook and the track endpoint each interpret ShipRocket status independently:

- The webhook maps numeric `current_status_id` via an inline `switch` that sets
  `tracking.*` flags, `orderStatus`, sends emails, restores RTO stock.
- `trackOrder` writes only `order.shipping.status` (the display string) — it never sets
  `statusCode`, `tracking.isDelivered`, or `orderStatus`, and never runs side-effects.

Because the dashboard counts delivered orders by `tracking.isDelivered` and `orderStatus`
(not by the status string), a manual track sync **cannot heal** a missed delivery. The
two paths will always drift. This duplication is the root reason the delivered-status bug
is unrecoverable.

## Goals

1. Assign journey never records `AWB_ASSIGNED` without a real AWB; failures land in a
   clear, retryable `AWB_FAILED` state with the reason surfaced to the admin UI.
2. A single canonical status engine drives every path (webhook, track, reconcile) so they
   can never drift.
3. Manual track sync becomes a real fallback that heals missed webhooks — including for
   orders with no AWB yet (via `providerShipmentId`).
4. Forward deliveries can never be swallowed as returns.
5. A one-off recovery script fixes already-stuck orders.

Non-goals: recurring cron sweep (user will run reconcile manually); changing the reverse
(returns) status transitions themselves; changing the ShipRocket auth/token flow.

## Architecture — one shared status engine

New module: **`backend/modules/shipping/utils/shipmentStatus.js`**

```js
applyShipmentStatus(order, { code, text, location, remarks, edd, chargedWeight, scanDate })
  -> { changed, previousStatusCode, sideEffects }
```

Every path that learns a ShipRocket status calls this. It is the ONLY place that
interprets status.

- **Canonical code resolution:** `const c = code ?? textToCode(normalize(text))`.
  `textToCode` maps normalized status strings (`"delivered"`, `"out for delivery"`,
  `"rto delivered"`, etc.) to the numeric codes already used by the webhook. `normalize`
  lowercases and trims. If neither a code nor a mappable text is present, the function
  records the raw text to `shipping.status` and returns `{ changed: false }` (no state
  transition, no side-effects).
- **Writes:** `shipping.status` (canonical string), `shipping.statusCode`,
  `shipping.syncedAt`, appends `trackingHistory`, updates `estimatedDeliveryDate` when
  `edd` present.
- **Monotonic / idempotent:** uses the existing `STATUS_PRIORITY` table. A transition is
  applied only if `newPriority > currentPriority`, OR the code is a "can-happen-anytime"
  code (21 = weight discrepancy). This fixes the current broken guard
  (`&& order.shipping.statusCode === statusCode`, which defeated the priority logic). A
  stale, lower-priority event can never regress a `Delivered` order.
- **Side-effects returned, not fired:** the function returns a `sideEffects` array
  (e.g. `[{ type: 'email', kind: 'delivered' }]`, `[{ type: 'restoreStockOnRTO' }]`).
  The caller decides whether to execute them. This keeps the function pure/testable and
  lets the reconcile script suppress customer emails on a bulk backfill.
- **Status effects owned by the engine** (moved out of the webhook's inline switch):
  - 6 Shipped → `tracking.isProcessing`, `orderStatus='Processing'`, email:shipped
  - 17 Out for Delivery → `tracking.isOutForDelivery`, `orderStatus='Out For Delivery'`, email:ofd
  - 7 Delivered → `tracking.isDelivered`, `deliveredAt`, `orderStatus='Delivered'`, clear NDR, email:delivered
  - 9 NDR → `shipping.ndr.*`, email:ndr-alert
  - 14 RTO Initiated → `shipping.isRTO`, email:rto-alert
  - 15 RTO Delivered → `rtoDeliveredAt`, sideEffect:restoreStockOnRTO
  - 18 Pickup Scheduled → `pickupScheduledDate`
  - 21 Weight Discrepancy → push `shipping.errors`, email:weight-dispute

## Path-level changes

### 1. Assign journey — `shippingOrderController.js`

Shared helper:

```js
const extractAwb = (resp) => {
  const d = resp?.response?.data || {};
  const awbCode = d.awb_code || resp?.awb_code || null;
  const error = d.awb_assign_error || resp?.awb_assign_error || resp?.message || null;
  return { awbCode, courierName: d.courier_name || resp?.courier_name, error };
};
```

Applied in **both** `createShippingOrder` (single-step block) and `assignCourier`:

- **AWB present:** set `awbCode`, `courierName`, `courierId`, `status='AWB_ASSIGNED'`,
  `isShipped=true`, charges/EDD, `syncedAt`.
- **No AWB:** `status='AWB_FAILED'`; push
  `{ action:'ASSIGN_AWB', message: error || 'No AWB returned by provider' }` to
  `shipping.errors`; keep `courierId`; do NOT set `isShipped`. Response includes
  `awbAssigned: false` and `reason` (the provider error) so the admin UI can show why.
- **Retry:** `assignCourier`'s existing guard keys on `awbCode` existing; a failed assign
  leaves `awbCode` empty, so retry is naturally unblocked. The same body-error handling
  applies on retry, so a repeated failure stays `AWB_FAILED` rather than falsely
  succeeding.

`AWB_FAILED` is a new value of the free-form `shipping.status` string (no schema change;
`status` is already `{ type: String }`).

### 2. Track / status-pull — `shippingTrackingController.js`

- Remove the hard-throw on missing AWB. Resolution order:
  1. `awbCode` present → `GET /courier/track/awb/{awbCode}`
  2. else `providerShipmentId` present → `GET /courier/track/shipment/{shipmentId}`
  3. else → 400 `"Order has no AWB or shipment id to track"`
- Feed the response through `applyShipmentStatus(order, { text: latest.current_status,
  edd: latest.edd, ... })` instead of writing `shipping.status` alone. Manual sync now
  heals `tracking.isDelivered` / `orderStatus`, backfills a discovered `awbCode` when the
  track response includes one, and (caller decides) may send the delivered email.
- Still returns the raw tracking payload for the admin UI.

### 3. Webhook — `shippingWebhookController.js`

- **Forward-wins routing** (replaces reverse-first ordering — fixes Bug #2):
  1. Look up forward `Order` by AWB, then by `providerOrderId`.
  2. If a forward Order matches → treat as forward delivery → `applyShipmentStatus`.
  3. Else if AWB matches a non-terminal `ReturnRequest` → `handleReverseWebhook`.
  4. Else → `order_not_found` (log, return 200).
  A forward delivery can never be swallowed as a return, because forward ownership is
  checked first and wins on any AWB conflict. Genuine return AWBs match no forward Order,
  so returns continue to work.
- Replace the inline `switch` (status effects) with a single `applyShipmentStatus` call,
  then execute the returned `sideEffects` (fire emails, run `restoreStockOnRTO`) —
  preserving current webhook behavior (webhook fires all emails).
- Idempotency now lives entirely in `applyShipmentStatus` (priority-based); the broken
  line-153 guard is removed.
- Keep the webhook-secret check and always-200 behavior unchanged.

### 4. Recovery — `scripts/reconcileShipping.js` (new) + reusable `reconcileOrder`

- Reusable `reconcileOrder(order, { sendEmails = false })` in shipping utils: re-pulls
  track (by AWB, else `providerShipmentId`), runs `applyShipmentStatus`, executes returned
  side-effects only if `sendEmails` (RTO stock restore always runs).
- Script selects candidates:
  `{ 'shipping.isShipped': true, 'tracking.isDelivered': false }` plus
  `{ 'shipping.status': 'AWB_FAILED' }` and `AWB_ASSIGNED`-with-empty-`awbCode`.
- Run manually: `node backend/scripts/reconcileShipping.js`. Prints a summary
  (healed / still-pending / errored). `sendEmails` defaults to false so a bulk backfill of
  old orders does not blast customers.
- No cron / no `setInterval` (user runs it manually).

## Error handling

- ShipRocket 200-with-body-error: detected in `extractAwb` (assign) and tolerated in
  `applyShipmentStatus` (unmappable status → no-op, logged).
- Track API failures propagate as today (logged in `ShippingLog` by `shippingClient`).
- Reconcile script isolates per-order failures (one bad order does not abort the run) and
  records them in the summary.

## Testing — `node --test`

New: `backend/modules/shipping/utils/shipmentStatus.test.js` (follows the returns-module
test pattern). Cases:

1. Low-balance assign response (200, `awb_assign_error`, no `awb_code`) →
   `extractAwb` returns no AWB → order becomes `AWB_FAILED`, not `AWB_ASSIGNED`.
2. Delivered via text (`current_status: "Delivered"`, no code) → `textToCode` → 7 →
   `tracking.isDelivered = true`, `orderStatus = 'Delivered'`, delivered side-effect returned.
3. Monotonicity: applying code 17 (OFD) after code 7 (Delivered) is a no-op
   (`changed: false`); order stays Delivered.
4. Track with no AWB but a `providerShipmentId` selects the shipment-track endpoint.
5. Forward-wins routing: an AWB matching both a forward Order and a ReturnRequest routes
   to forward delivery.
6. RTO Delivered (15) returns exactly one `restoreStockOnRTO` side-effect.

## Files touched

- `backend/modules/shipping/utils/shipmentStatus.js` — new (status engine)
- `backend/modules/shipping/utils/shipmentStatus.test.js` — new (tests)
- `backend/modules/shipping/controllers/shippingOrderController.js` — assign hardening
- `backend/modules/shipping/controllers/shippingTrackingController.js` — track via engine + shipment_id fallback
- `backend/modules/shipping/controllers/shippingWebhookController.js` — forward-wins routing + engine
- `backend/modules/shipping/utils/reconcileShipping.js` — new (reusable `reconcileOrder`)
- `backend/scripts/reconcileShipping.js` — new (thin manual-run wrapper over `reconcileOrder`)

## Out of scope

- Recurring cron/scheduled reconcile (manual for now).
- Reverse (returns) status transition semantics.
- ShipRocket auth/token flow.
- Frontend rendering of the `AWB_FAILED` reason (backend exposes it; UI wiring separate).
