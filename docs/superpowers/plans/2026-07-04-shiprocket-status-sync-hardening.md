# ShipRocket Status Sync Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ShipRocket delivery status reliably reach the admin dashboard by unifying all status interpretation behind one engine, hardening the AWB-assign flow against silent 200-errors, and making forward deliveries un-swallowable by the returns webhook.

**Architecture:** Introduce `shipmentStatus.js` — a pure `applyShipmentStatus(order, meta)` engine (code-first with text fallback, monotonic via a priority table, side-effects returned not fired). The webhook, the track endpoint, and a manual reconcile script all route through it. Assign flows detect ShipRocket body-level errors and land failures in a retryable `AWB_FAILED` state. The webhook switches to forward-wins routing so a forward AWB is never mistaken for a return.

**Tech Stack:** Node.js (ESM), Express, Mongoose, ShipRocket REST API, `node:test` + `node:assert/strict` for tests.

**Spec:** `docs/superpowers/specs/2026-07-04-shiprocket-status-sync-hardening-design.md`

---

## File Structure

- **Create** `backend/modules/shipping/utils/shipmentStatus.js` — the status engine: `STATUS_PRIORITY`, `normalizeStatusText`, `textToCode`, `applyShipmentStatus`.
- **Create** `backend/modules/shipping/utils/shipmentStatus.test.js` — engine unit tests (`node --test`).
- **Create** `backend/modules/shipping/utils/reconcileShipping.js` — reusable `reconcileOrder(order, opts)`.
- **Create** `backend/scripts/reconcileShipping.js` — thin manual-run wrapper.
- **Modify** `backend/modules/shipping/controllers/shippingOrderController.js` — `extractAwb` helper; harden `createShippingOrder` single-step block and `assignCourier`.
- **Modify** `backend/modules/shipping/controllers/shippingTrackingController.js` — route through engine; `providerShipmentId` fallback; stop hard-throwing.
- **Modify** `backend/modules/shipping/controllers/shippingWebhookController.js` — forward-wins routing; replace inline switch with engine; fire returned side-effects.

Tests are run with: `npm test -- <path>` is NOT how this repo works. Use `node --test <path>` directly (repo `test` script globs the returns module only).

---

## Task 1: Status engine — priority table, text normalization, code mapping

**Files:**
- Create: `backend/modules/shipping/utils/shipmentStatus.js`
- Test: `backend/modules/shipping/utils/shipmentStatus.test.js`

- [ ] **Step 1: Write the failing test**

Create `backend/modules/shipping/utils/shipmentStatus.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStatusText, textToCode, STATUS_PRIORITY } from './shipmentStatus.js';

test('normalizeStatusText lowercases and trims', () => {
  assert.equal(normalizeStatusText('  Delivered '), 'delivered');
  assert.equal(normalizeStatusText('OUT FOR DELIVERY'), 'out for delivery');
});

test('textToCode maps known ShipRocket status strings to codes', () => {
  assert.equal(textToCode('Delivered'), 7);
  assert.equal(textToCode('out for delivery'), 17);
  assert.equal(textToCode('Shipped'), 6);
  assert.equal(textToCode('RTO Delivered'), 15);
  assert.equal(textToCode('Pickup Scheduled'), 18);
});

test('textToCode returns null for unknown text', () => {
  assert.equal(textToCode('some random courier note'), null);
  assert.equal(textToCode(''), null);
  assert.equal(textToCode(undefined), null);
});

test('STATUS_PRIORITY ranks Delivered above Out For Delivery', () => {
  assert.ok(STATUS_PRIORITY[7] > STATUS_PRIORITY[17]);
  assert.ok(STATUS_PRIORITY[15] > STATUS_PRIORITY[7]); // RTO delivered is terminal-most
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/modules/shipping/utils/shipmentStatus.test.js`
Expected: FAIL — `Cannot find module './shipmentStatus.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `backend/modules/shipping/utils/shipmentStatus.js`:

```js
// Status code priority (higher = further along the lifecycle). Mirrors the
// values previously inline in shippingWebhookController.js.
export const STATUS_PRIORITY = {
  6: 10,   // Shipped
  18: 15,  // Pickup Scheduled
  17: 20,  // Out for Delivery
  9: 25,   // NDR / Undelivered
  7: 30,   // Delivered
  14: 35,  // RTO Initiated
  15: 40,  // RTO Delivered
  21: 0,   // Weight Discrepancy (can happen anytime)
};

export const normalizeStatusText = (text) =>
  String(text ?? '').trim().toLowerCase();

// ShipRocket's track API returns a status string but no numeric code.
// Map the strings we act on back to the webhook's numeric codes.
const TEXT_TO_CODE = {
  'shipped': 6,
  'in transit': 6,
  'pickup scheduled': 18,
  'pickup generated': 18,
  'out for delivery': 17,
  'undelivered': 9,
  'ndr': 9,
  'delivered': 7,
  'rto initiated': 14,
  'rto in transit': 14,
  'rto delivered': 15,
  'rto': 14,
};

export const textToCode = (text) => {
  const key = normalizeStatusText(text);
  if (!key) return null;
  return TEXT_TO_CODE[key] ?? null;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/modules/shipping/utils/shipmentStatus.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/modules/shipping/utils/shipmentStatus.js backend/modules/shipping/utils/shipmentStatus.test.js
git commit -m "feat(shipping): status text->code map + priority table"
```

---

## Task 2: `applyShipmentStatus` — canonical state transition + side-effects

**Files:**
- Modify: `backend/modules/shipping/utils/shipmentStatus.js`
- Test: `backend/modules/shipping/utils/shipmentStatus.test.js`

**Contract:** `applyShipmentStatus(order, { code, text, location, remarks, edd, chargedWeight, scanDate })` returns `{ changed, previousStatusCode, sideEffects }`. It mutates `order` but does NOT call `order.save()` and does NOT send emails — the caller does both. `sideEffects` is an array of `{ type: 'email', kind }` and `{ type: 'restoreStockOnRTO' }`.

- [ ] **Step 1: Write the failing test**

Append to `backend/modules/shipping/utils/shipmentStatus.test.js`:

```js
import { applyShipmentStatus } from './shipmentStatus.js';

// Minimal fake order shaped like the Mongoose doc fields the engine touches.
const makeOrder = (overrides = {}) => ({
  orderStatus: 'Processing',
  tracking: { isProcessing: false, isOutForDelivery: false, isDelivered: false },
  shipping: {
    status: 'AWB_ASSIGNED',
    statusCode: undefined,
    ndr: { isNDR: false, ndrCount: 0, ndrActions: [] },
    trackingHistory: [],
    errors: [],
    ...overrides.shipping,
  },
  ...overrides,
});

test('applyShipmentStatus marks delivered from numeric code 7', () => {
  const order = makeOrder();
  const res = applyShipmentStatus(order, { code: 7, text: 'Delivered' });
  assert.equal(res.changed, true);
  assert.equal(order.tracking.isDelivered, true);
  assert.equal(order.orderStatus, 'Delivered');
  assert.equal(order.shipping.statusCode, 7);
  assert.ok(res.sideEffects.some((s) => s.type === 'email' && s.kind === 'delivered'));
});

test('applyShipmentStatus marks delivered from TEXT only (track path)', () => {
  const order = makeOrder();
  const res = applyShipmentStatus(order, { text: 'Delivered' }); // no code
  assert.equal(res.changed, true);
  assert.equal(order.tracking.isDelivered, true);
  assert.equal(order.orderStatus, 'Delivered');
  assert.equal(order.shipping.statusCode, 7);
});

test('applyShipmentStatus is monotonic — OFD after Delivered is a no-op', () => {
  const order = makeOrder({ shipping: { statusCode: 7, status: 'Delivered' } });
  order.tracking.isDelivered = true;
  order.orderStatus = 'Delivered';
  const res = applyShipmentStatus(order, { code: 17, text: 'Out for Delivery' });
  assert.equal(res.changed, false);
  assert.equal(order.orderStatus, 'Delivered');
});

test('applyShipmentStatus RTO delivered (15) returns one stock-restore side-effect', () => {
  const order = makeOrder({ shipping: { statusCode: 14, status: 'RTO Initiated' } });
  const res = applyShipmentStatus(order, { code: 15, text: 'RTO Delivered' });
  assert.equal(res.changed, true);
  const restores = res.sideEffects.filter((s) => s.type === 'restoreStockOnRTO');
  assert.equal(restores.length, 1);
});

test('applyShipmentStatus with unmappable status records string, no transition', () => {
  const order = makeOrder();
  const res = applyShipmentStatus(order, { text: 'Reached nearest hub' });
  assert.equal(res.changed, false);
  assert.equal(order.shipping.status, 'Reached nearest hub');
  assert.equal(order.tracking.isDelivered, false);
});

test('applyShipmentStatus pushes tracking history and syncedAt', () => {
  const order = makeOrder();
  applyShipmentStatus(order, { code: 6, text: 'Shipped', location: 'Delhi' });
  assert.equal(order.shipping.trackingHistory.length, 1);
  assert.equal(order.shipping.trackingHistory[0].statusCode, 6);
  assert.ok(order.shipping.syncedAt instanceof Date);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/modules/shipping/utils/shipmentStatus.test.js`
Expected: FAIL — `applyShipmentStatus is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `backend/modules/shipping/utils/shipmentStatus.js`:

```js
const CANONICAL_TEXT = {
  6: 'Shipped',
  18: 'Pickup Scheduled',
  17: 'Out For Delivery',
  9: 'Undelivered',
  7: 'Delivered',
  14: 'RTO Initiated',
  15: 'RTO Delivered',
  21: 'Weight Discrepancy',
};

/**
 * Canonical status engine. Mutates `order` in place. Does NOT save or send email.
 * Returns { changed, previousStatusCode, sideEffects }.
 */
export const applyShipmentStatus = (order, meta = {}) => {
  const { code, text, location = '', remarks, edd, chargedWeight, scanDate } = meta;
  const resolvedCode = code ?? textToCode(text);
  const sideEffects = [];
  const previousStatusCode = order.shipping.statusCode;

  // Unmappable status: record the raw string for display, no transition.
  if (resolvedCode == null) {
    if (text) order.shipping.status = String(text);
    order.shipping.syncedAt = new Date();
    return { changed: false, previousStatusCode, sideEffects };
  }

  // Monotonicity: never regress to a lower/equal-priority state.
  // Code 21 (weight discrepancy) is allowed anytime.
  const currentPriority = STATUS_PRIORITY[previousStatusCode] ?? -1;
  const newPriority = STATUS_PRIORITY[resolvedCode] ?? -1;
  if (resolvedCode !== 21 && newPriority <= currentPriority) {
    return { changed: false, previousStatusCode, sideEffects };
  }

  // Apply canonical status + history.
  order.shipping.status = CANONICAL_TEXT[resolvedCode] || String(text || resolvedCode);
  order.shipping.statusCode = resolvedCode;
  order.shipping.syncedAt = new Date();
  if (edd) order.shipping.estimatedDeliveryDate = new Date(edd);

  order.shipping.trackingHistory.push({
    status: order.shipping.status,
    statusCode: resolvedCode,
    location,
    timestamp: scanDate ? new Date(scanDate) : new Date(),
    remarks: remarks || order.shipping.status,
  });

  switch (resolvedCode) {
    case 6: // Shipped
      order.tracking.isProcessing = true;
      order.tracking.processedAt = order.tracking.processedAt || new Date();
      order.orderStatus = 'Processing';
      sideEffects.push({ type: 'email', kind: 'shipped' });
      break;
    case 17: // Out for Delivery
      order.tracking.isOutForDelivery = true;
      order.tracking.outForDeliveryAt = new Date();
      order.orderStatus = 'Out For Delivery';
      sideEffects.push({ type: 'email', kind: 'ofd' });
      break;
    case 7: // Delivered
      order.tracking.isDelivered = true;
      order.tracking.deliveredAt = new Date();
      order.orderStatus = 'Delivered';
      if (order.shipping.ndr?.isNDR) order.shipping.ndr.isNDR = false;
      sideEffects.push({ type: 'email', kind: 'delivered' });
      break;
    case 9: // NDR
      if (!order.shipping.ndr) order.shipping.ndr = { isNDR: false, ndrCount: 0, ndrActions: [] };
      order.shipping.ndr.isNDR = true;
      order.shipping.ndr.ndrCount = (order.shipping.ndr.ndrCount || 0) + 1;
      order.shipping.ndr.lastNdrAt = new Date();
      order.shipping.ndr.lastNdrReason = remarks || 'Undelivered';
      sideEffects.push({ type: 'email', kind: 'ndr', reason: order.shipping.ndr.lastNdrReason });
      break;
    case 14: // RTO Initiated
      order.shipping.isRTO = true;
      order.shipping.rtoInitiatedAt = new Date();
      sideEffects.push({ type: 'email', kind: 'rto' });
      break;
    case 15: // RTO Delivered
      order.shipping.rtoDeliveredAt = new Date();
      sideEffects.push({ type: 'restoreStockOnRTO' });
      break;
    case 18: // Pickup Scheduled
      order.shipping.pickupScheduledDate = new Date();
      break;
    case 21: // Weight Discrepancy
      order.shipping.errors.push({
        action: 'WEIGHT_DISCREPANCY',
        message: `Provider reported weight: ${chargedWeight}kg vs entered: ${order.shipping.weight}kg`,
      });
      sideEffects.push({ type: 'email', kind: 'weight', chargedWeight });
      break;
  }

  return { changed: true, previousStatusCode, sideEffects };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/modules/shipping/utils/shipmentStatus.test.js`
Expected: PASS (all tests, Task 1 + Task 2).

- [ ] **Step 5: Commit**

```bash
git add backend/modules/shipping/utils/shipmentStatus.js backend/modules/shipping/utils/shipmentStatus.test.js
git commit -m "feat(shipping): applyShipmentStatus canonical status engine"
```

---

## Task 3: Harden the assign journey against 200-with-body-error

**Files:**
- Modify: `backend/modules/shipping/controllers/shippingOrderController.js` (single-step block ~107-126; `assignCourier` ~163-172)
- Test: `backend/modules/shipping/utils/shipmentStatus.test.js` (co-locate the `extractAwb` unit test here — it is exported from the controller for testability)

**Note:** `extractAwb` is a pure helper. Export it from the controller so it can be unit-tested without spinning up Express.

- [ ] **Step 1: Write the failing test**

Append to `backend/modules/shipping/utils/shipmentStatus.test.js`:

```js
import { extractAwb } from '../controllers/shippingOrderController.js';

test('extractAwb pulls awb from nested response.data', () => {
  const r = extractAwb({ response: { data: { awb_code: '123', courier_name: 'Delhivery' } } });
  assert.equal(r.awbCode, '123');
  assert.equal(r.courierName, 'Delhivery');
  assert.equal(r.error, null);
});

test('extractAwb detects ShipRocket 200-body error (low balance) with no awb', () => {
  const r = extractAwb({ response: { data: {} }, awb_assign_error: 'Insufficient wallet balance' });
  assert.equal(r.awbCode, null);
  assert.equal(r.error, 'Insufficient wallet balance');
});

test('extractAwb reports missing awb even without an explicit error', () => {
  const r = extractAwb({ response: { data: {} } });
  assert.equal(r.awbCode, null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/modules/shipping/utils/shipmentStatus.test.js`
Expected: FAIL — `extractAwb` is not exported.

- [ ] **Step 3: Add `extractAwb` and use it in both assign paths**

In `backend/modules/shipping/controllers/shippingOrderController.js`, add near the top (after imports):

```js
/**
 * Pull the AWB (and any body-level error) out of a ShipRocket assign/awb response.
 * ShipRocket returns HTTP 200 even on failure; the error lives in the body.
 */
export const extractAwb = (resp) => {
  const d = resp?.response?.data || {};
  const awbCode = d.awb_code || resp?.awb_code || null;
  const error = d.awb_assign_error || resp?.awb_assign_error || resp?.message || null;
  return { awbCode, courierName: d.courier_name || resp?.courier_name || null, error };
};
```

Replace the single-step block in `createShippingOrder` (the `try` body inside `if (req.body.courierId)`, currently lines ~107-125) with:

```js
      const { awbCode, courierName, error } = extractAwb(awbResponse);

      if (!awbCode) {
        // ShipRocket accepted the call (HTTP 200) but returned no AWB — e.g. low
        // wallet balance, KYC hold, non-serviceable. Do NOT claim AWB_ASSIGNED.
        order.shipping.courierId = req.body.courierId;
        order.shipping.status = 'AWB_FAILED';
        order.shipping.syncedAt = new Date();
        if (!order.shipping.errors) order.shipping.errors = [];
        order.shipping.errors.push({
          action: 'ASSIGN_AWB',
          message: error || 'No AWB returned by provider',
        });
        await order.save();

        response.awbAssigned = false;
        response.reason = error || 'No AWB returned by provider';
        response.message = `Order created but courier assignment failed: ${response.reason}. Fix the cause (e.g. wallet balance) and retry.`;
      } else {
        order.shipping.awbCode = awbCode;
        order.shipping.courierName = courierName || req.body.courierName || 'Assigned';
        order.shipping.courierId = req.body.courierId;
        order.shipping.status = 'AWB_ASSIGNED';
        order.shipping.isShipped = true;
        if (req.body.courierCharges) order.shipping.courierCharges = req.body.courierCharges;
        if (req.body.estimatedDeliveryDate) order.shipping.estimatedDeliveryDate = new Date(req.body.estimatedDeliveryDate);
        order.shipping.syncedAt = new Date();
        await order.save();

        response.awbAssigned = true;
        response.awbCode = order.shipping.awbCode;
        response.courierName = order.shipping.courierName;
        response.message = 'Order created and courier assigned';
      }
```

Replace the body of `assignCourier` after the `shippingApi(...)` call (currently lines ~163-178) with:

```js
  const { awbCode, courierName, error } = extractAwb(data);

  if (!awbCode) {
    order.shipping.courierId = courierId;
    order.shipping.status = 'AWB_FAILED';
    order.shipping.syncedAt = new Date();
    if (!order.shipping.errors) order.shipping.errors = [];
    order.shipping.errors.push({
      action: 'ASSIGN_AWB',
      message: error || 'No AWB returned by provider',
    });
    await order.save();

    res.status(502).json({
      message: `Courier assignment failed: ${error || 'No AWB returned by provider'}`,
      awbAssigned: false,
      reason: error || 'No AWB returned by provider',
    });
    return;
  }

  order.shipping.awbCode = awbCode;
  order.shipping.courierName = courierName || reqCourierName || 'Assigned';
  order.shipping.courierId = courierId;
  order.shipping.isShipped = true;
  if (courierCharges) order.shipping.courierCharges = courierCharges;
  if (estimatedDeliveryDate) order.shipping.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
  order.shipping.status = 'AWB_ASSIGNED';
  order.shipping.syncedAt = new Date();

  await order.save();

  res.json({
    message: 'Courier assigned successfully',
    awbAssigned: true,
    awbCode: order.shipping.awbCode,
    courierName: order.shipping.courierName,
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/modules/shipping/utils/shipmentStatus.test.js`
Expected: PASS (extractAwb tests included).

- [ ] **Step 5: Commit**

```bash
git add backend/modules/shipping/controllers/shippingOrderController.js backend/modules/shipping/utils/shipmentStatus.test.js
git commit -m "fix(shipping): AWB assign detects 200-body errors, lands AWB_FAILED (retryable)"
```

---

## Task 4: Route the webhook through the engine + forward-wins routing

**Files:**
- Modify: `backend/modules/shipping/controllers/shippingWebhookController.js`

**Behavior preserved:** webhook still fires all emails and runs RTO stock restore. Only the *routing* and *interpretation* change.

- [ ] **Step 1: Reorder routing to forward-wins and resolve the order first**

In `handleWebhook`, replace the block from `// Check if this is a reverse shipment webhook first` through the reverse early-return AND the subsequent order lookup (currently lines ~121-145) with:

```js
    // Resolve the forward order first (forward-wins routing): a forward AWB must
    // never be swallowed as a return. Returns are handled only when NO forward
    // order owns this AWB/order id.
    const awb = payload.awb || payload.awb_code;
    const srOrderId = payload.order_id;

    let order;
    if (awb) {
      order = await Order.findOne({ 'shipping.awbCode': awb });
    }
    if (!order && srOrderId) {
      order = await Order.findOne({ 'shipping.providerOrderId': srOrderId });
    }

    if (!order) {
      // No forward order owns this AWB — try reverse (returns) handling.
      const webhookStatusCode = Number(payload.current_status_id || payload.status_id || 0);
      const handledAsReturn = await handleReverseWebhook(awb || '', webhookStatusCode);
      if (handledAsReturn) {
        return res.status(200).json({ received: true, type: 'reverse' });
      }
      console.error('[Webhook] Order not found for AWB:', awb, 'Order ID:', srOrderId);
      return res.status(200).json({ status: 'order_not_found' });
    }
```

- [ ] **Step 2: Replace the inline switch with the engine**

Replace everything from `const statusCode = Number(...)` (line ~147) through the end of the `switch` block and the `await order.save()` (line ~262) with:

```js
    const statusCode = Number(payload.current_status_id || payload.status_code);
    const statusText = payload.current_status || payload.status;

    const { changed, sideEffects } = applyShipmentStatus(order, {
      code: statusCode,
      text: statusText,
      location: payload.current_location || payload.location || '',
      remarks: payload.scans?.[0]?.activity || statusText,
      edd: payload.etd || payload.edd,
      chargedWeight: payload.charged_weight || payload.weight,
      scanDate: payload.scans?.[0]?.date,
    });

    if (!changed) {
      return res.status(200).json({ status: 'already_processed' });
    }

    // Fire side-effects (emails + RTO stock restore). Errors are swallowed so the
    // webhook always returns 200.
    const user = await import('../../../models/UserModel.js').then((m) => m.default.findById(order.user));
    for (const fx of sideEffects) {
      try {
        if (fx.type === 'restoreStockOnRTO') {
          await restoreStockOnRTO(order);
        } else if (fx.type === 'email' && user) {
          if (fx.kind === 'shipped') sendOrderShippedEmail(order, user, { awb: order.shipping.awbCode, courier: order.shipping.courierName }).catch((e) => console.error('[Webhook] Shipped email failed:', e.message));
          else if (fx.kind === 'ofd') sendOutForDeliveryEmail(order, user, { awb: order.shipping.awbCode, courier: order.shipping.courierName }).catch((e) => console.error('[Webhook] OFD email failed:', e.message));
          else if (fx.kind === 'delivered') sendOrderDeliveredEmail(order, user).catch((e) => console.error('[Webhook] Delivered email failed:', e.message));
        }
        if (fx.type === 'email' && fx.kind === 'ndr') sendNDRAlertEmail(order, fx.reason).catch((e) => console.error('[Webhook] NDR email failed:', e.message));
        else if (fx.type === 'email' && fx.kind === 'rto') sendRTOAlertEmail(order).catch((e) => console.error('[Webhook] RTO email failed:', e.message));
        else if (fx.type === 'email' && fx.kind === 'weight') sendWeightDisputeEmail(order, fx.chargedWeight).catch((e) => console.error('[Webhook] Weight dispute email failed:', e.message));
      } catch (e) {
        console.error('[Webhook] Side-effect failed:', e.message);
      }
    }

    await order.save();
```

- [ ] **Step 3: Add the engine import**

At the top of `shippingWebhookController.js`, add:

```js
import { applyShipmentStatus } from '../utils/shipmentStatus.js';
```

Remove the now-unused `STATUS_PRIORITY` constant (lines ~22-32) since idempotency now lives in the engine. Leave `REVERSE_STATUS_MAP` and `handleReverseWebhook` untouched.

- [ ] **Step 4: Verify the module loads and existing tests still pass**

Run: `node --check backend/modules/shipping/controllers/shippingWebhookController.js`
Expected: no output (syntax OK).

Run: `node --test backend/modules/shipping/utils/shipmentStatus.test.js`
Expected: PASS (unchanged).

- [ ] **Step 5: Commit**

```bash
git add backend/modules/shipping/controllers/shippingWebhookController.js
git commit -m "fix(shipping): webhook forward-wins routing + shared status engine"
```

---

## Task 5: Route the track endpoint through the engine + shipment_id fallback

**Files:**
- Modify: `backend/modules/shipping/controllers/shippingTrackingController.js` (`trackOrder`, lines ~8-66)

- [ ] **Step 1: Replace the AWB guard and status write**

Replace `trackOrder`'s guard + fetch + status-write (lines ~16-55) with:

```js
  const awbCode = order.shipping?.awbCode;
  const shipmentId = order.shipping?.providerShipmentId;

  if (!awbCode && !shipmentId) {
    res.status(400);
    throw new Error('Order has no AWB or shipment id to track');
  }

  // Prefer AWB tracking; fall back to shipment-id tracking for orders whose AWB
  // never landed (e.g. AWB_FAILED / assign that returned no AWB).
  const endpoint = awbCode
    ? `/courier/track/awb/${awbCode}`
    : `/courier/track/shipment/${shipmentId}`;

  const data = await shippingApi('get', endpoint, {
    action: 'TRACK',
    orderId: order._id,
    asuOrderId: order.orderId,
  });

  const trackingData = data.tracking_data;
  if (trackingData) {
    const shipmentTrack = trackingData.shipment_track || [];
    const latest = shipmentTrack[0] || {};

    // Backfill a discovered AWB (shipment-id tracking often returns it).
    if (!order.shipping.awbCode && latest.awb_code) {
      order.shipping.awbCode = latest.awb_code;
    }

    const { changed, sideEffects } = applyShipmentStatus(order, {
      text: latest.current_status,
      edd: latest.edd,
      location: latest.destination || '',
    });

    // Manual track does not send customer emails (avoid double-send vs webhook);
    // it only heals dashboard state. RTO stock restore still runs.
    if (changed) {
      for (const fx of sideEffects) {
        if (fx.type === 'restoreStockOnRTO') {
          const { restoreStockOnRTO } = await import('../utils/reconcileShipping.js');
          await restoreStockOnRTO(order);
        }
      }
    }

    await order.save();
  }
```

**Note:** `restoreStockOnRTO` currently lives in the webhook controller. Task 6 extracts it into `reconcileShipping.js` so both track and reconcile can use it. If Task 6 is not yet done, temporarily import from the webhook controller instead. Sequence Task 6 before running this branch, OR keep the RTO branch guarded — for the common delivered case there is no RTO side-effect, so `node --check` passes regardless.

- [ ] **Step 2: Add the engine import**

At the top of `shippingTrackingController.js`, add:

```js
import { applyShipmentStatus } from '../utils/shipmentStatus.js';
```

- [ ] **Step 3: Verify module loads**

Run: `node --check backend/modules/shipping/controllers/shippingTrackingController.js`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add backend/modules/shipping/controllers/shippingTrackingController.js
git commit -m "fix(shipping): track syncs via status engine + shipment_id fallback"
```

---

## Task 6: Extract `restoreStockOnRTO` + reusable `reconcileOrder`

**Files:**
- Create: `backend/modules/shipping/utils/reconcileShipping.js`
- Modify: `backend/modules/shipping/controllers/shippingWebhookController.js` (import `restoreStockOnRTO` from the new module; delete the local copy)

- [ ] **Step 1: Move `restoreStockOnRTO` into the new module**

Create `backend/modules/shipping/utils/reconcileShipping.js`. Copy the `restoreStockOnRTO` function body verbatim from `shippingWebhookController.js` (lines ~275-322), converting it to a named default export, and add `reconcileOrder`:

```js
import Order from '../../../models/OrderModel.js';
import Product from '../../../models/ProductModel.js';
import StockMovement from '../../stock/models/StockMovementModel.js';
import handleStockAlerts from '../../stock/utils/stockAlertHelper.js';
import { shippingApi } from './shippingClient.js';
import { applyShipmentStatus } from './shipmentStatus.js';

/**
 * Restore stock when an RTO shipment is delivered back. (Moved verbatim from the
 * webhook controller so track + reconcile can reuse it.)
 */
export const restoreStockOnRTO = async (order) => {
  try {
    const items = order.modified && order.modifiedItems?.length > 0
      ? order.modifiedItems
      : order.orderItems;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) continue;
      const sizeVariant = product.size.find((s) => s.size.toLowerCase() === item.size.toLowerCase());
      if (!sizeVariant) continue;
      sizeVariant.countInStock += item.qty;
      await product.save();
      await StockMovement.create({
        product: product._id,
        productName: product.name,
        SKU: sizeVariant.SKU || `${product.name}-${sizeVariant.size}`,
        size: sizeVariant.size,
        type: 'RETURN',
        quantity: item.qty,
        previousStock: sizeVariant.countInStock - item.qty,
        newStock: sizeVariant.countInStock,
        reason: `RTO delivered - Order ${order.orderId}`,
        reference: { type: 'order', id: order._id, orderId: order.orderId },
      });
      await handleStockAlerts(product, sizeVariant);
    }
  } catch (error) {
    console.error('[Reconcile] Stock restoration failed for RTO:', error.message);
    if (!order.shipping.errors) order.shipping.errors = [];
    order.shipping.errors.push({ action: 'RTO_STOCK_RESTORE', message: error.message });
  }
};

export default restoreStockOnRTO;

/**
 * Re-pull tracking for a single order and heal its status via the engine.
 * `sendEmails` defaults false so bulk backfills don't blast customers.
 * Returns { orderId, outcome } where outcome is 'healed' | 'unchanged' | 'no-track' | 'error'.
 */
export const reconcileOrder = async (order, { sendEmails = false } = {}) => {
  const awbCode = order.shipping?.awbCode;
  const shipmentId = order.shipping?.providerShipmentId;
  if (!awbCode && !shipmentId) return { orderId: order.orderId, outcome: 'no-track' };

  const endpoint = awbCode
    ? `/courier/track/awb/${awbCode}`
    : `/courier/track/shipment/${shipmentId}`;

  try {
    const data = await shippingApi('get', endpoint, { action: 'TRACK', orderId: order._id, asuOrderId: order.orderId, source: 'reconcile' });
    const latest = data?.tracking_data?.shipment_track?.[0];
    if (!latest) return { orderId: order.orderId, outcome: 'no-track' };

    if (!order.shipping.awbCode && latest.awb_code) order.shipping.awbCode = latest.awb_code;

    const { changed, sideEffects } = applyShipmentStatus(order, {
      text: latest.current_status,
      edd: latest.edd,
      location: latest.destination || '',
    });

    for (const fx of sideEffects) {
      if (fx.type === 'restoreStockOnRTO') await restoreStockOnRTO(order);
      // Emails intentionally suppressed unless sendEmails — wire in if needed.
    }

    await order.save();
    return { orderId: order.orderId, outcome: changed ? 'healed' : 'unchanged' };
  } catch (error) {
    return { orderId: order.orderId, outcome: 'error', error: error.message };
  }
};
```

- [ ] **Step 2: Delete the local copy in the webhook controller and import instead**

In `shippingWebhookController.js`, delete the local `async function restoreStockOnRTO(order) {...}` (lines ~272-322) and add near the other imports:

```js
import { restoreStockOnRTO } from '../utils/reconcileShipping.js';
```

- [ ] **Step 3: Verify both modules load**

Run: `node --check backend/modules/shipping/utils/reconcileShipping.js && node --check backend/modules/shipping/controllers/shippingWebhookController.js`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add backend/modules/shipping/utils/reconcileShipping.js backend/modules/shipping/controllers/shippingWebhookController.js
git commit -m "refactor(shipping): extract restoreStockOnRTO + reconcileOrder helper"
```

---

## Task 7: Manual recovery script

**Files:**
- Create: `backend/scripts/reconcileShipping.js`

- [ ] **Step 1: Write the script**

Create `backend/scripts/reconcileShipping.js` (mirrors `exportDelayedOrders.js` bootstrap):

```js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import connectDB from '../config/db.js';
import Order from '../models/OrderModel.js';
import { reconcileOrder } from '../modules/shipping/utils/reconcileShipping.js';

const run = async () => {
  await connectDB();
  console.log('✅ MongoDB Connected\n');

  const candidates = await Order.find({
    $or: [
      { 'shipping.isShipped': true, 'tracking.isDelivered': false },
      { 'shipping.status': 'AWB_FAILED' },
      { 'shipping.status': 'AWB_ASSIGNED', 'shipping.awbCode': { $in: [null, ''] } },
    ],
  });

  console.log(`Found ${candidates.length} candidate orders to reconcile.\n`);
  const summary = { healed: 0, unchanged: 0, 'no-track': 0, error: 0 };

  for (const order of candidates) {
    const res = await reconcileOrder(order, { sendEmails: false });
    summary[res.outcome] = (summary[res.outcome] || 0) + 1;
    const tag = res.outcome === 'healed' ? '✅' : res.outcome === 'error' ? '❌' : '·';
    console.log(`${tag} ${res.orderId}: ${res.outcome}${res.error ? ` (${res.error})` : ''}`);
  }

  console.log('\n=== Summary ===');
  console.log(summary);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => {
  console.error('Reconcile failed:', e);
  process.exit(1);
});
```

- [ ] **Step 2: Verify the module loads**

Run: `node --check backend/scripts/reconcileShipping.js`
Expected: no output.

- [ ] **Step 3: Dry-run against staging (manual, optional)**

Run: `node --env-file=.env.staging backend/scripts/reconcileShipping.js`
Expected: prints candidate count, per-order outcomes, summary. Verify a known-delivered-but-stuck order flips to `healed`.

- [ ] **Step 4: Commit**

```bash
git add backend/scripts/reconcileShipping.js
git commit -m "feat(shipping): manual reconcile script to heal stuck orders"
```

---

## Task 8: Full test + integration smoke

- [ ] **Step 1: Run the full engine test suite**

Run: `node --test backend/modules/shipping/utils/shipmentStatus.test.js`
Expected: PASS (all tasks' tests).

- [ ] **Step 2: Confirm returns tests still pass (no regression)**

Run: `npm test`
Expected: PASS (returns module suite unaffected).

- [ ] **Step 3: Syntax-check all touched modules**

Run:
```bash
node --check backend/modules/shipping/controllers/shippingOrderController.js && \
node --check backend/modules/shipping/controllers/shippingTrackingController.js && \
node --check backend/modules/shipping/controllers/shippingWebhookController.js && \
node --check backend/modules/shipping/utils/shipmentStatus.js && \
node --check backend/modules/shipping/utils/reconcileShipping.js && \
node --check backend/scripts/reconcileShipping.js && echo "ALL OK"
```
Expected: `ALL OK`.

- [ ] **Step 4: Verify end-to-end with the `verify` skill / run skill**

Drive the real flow: assign a courier to a test order in a low-balance-simulated state (or point at staging), confirm the order lands `AWB_FAILED` with a reason and does NOT show `AWB_ASSIGNED`; then run the reconcile script and confirm a delivered order heals on the dashboard.

- [ ] **Step 5: Final commit / branch wrap**

```bash
git add -A && git commit -m "test(shipping): full status-sync hardening verification" || echo "nothing to commit"
```

---

## Notes for the implementer

- The repo `test` script only globs the returns module. Run shipping tests explicitly with `node --test <path>`.
- `applyShipmentStatus` never calls `order.save()` — every caller saves. Don't add a save inside the engine.
- Emails: the **webhook** fires them; **track** and **reconcile** suppress customer emails by default (RTO stock restore always runs). This prevents double-sends when a webhook and a manual sync race.
- Sequence Task 6 before exercising Task 5's RTO branch (Task 5 imports `restoreStockOnRTO` from the module Task 6 creates).
