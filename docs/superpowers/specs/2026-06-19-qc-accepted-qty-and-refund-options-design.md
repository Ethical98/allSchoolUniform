# QC Accepted-Qty, Full-Refund Choice, and No-Shipping-Refund — Design

**Date:** 2026-06-19
**Status:** Approved (pending spec review)

## Summary

Three intertwined changes to the returns flow:

1. **QC accepted quantity** — during QC, an admin can accept fewer units than the
   customer requested to return. Refund and restock use the accepted quantity; the
   shortfall is silently dropped (no refund, no stock movement).
2. **Full-refund choice** — at the Initiate Refund step, the admin can choose to
   refund all requested item units at paid (discounted) price, ignoring QC-based
   reductions (accepted-qty shortfall and UNSELLABLE/NOT_RECEIVED zeroing).
3. **No shipping refund anywhere** — shipping is never refunded in any return,
   full-refund or QC-adjusted. Only the discounted item amount is refundable.

## Decisions (from brainstorming)

- Editing qty in QC = **adjust accepted qty** (only M of N requested units accepted).
- Shortfall (N − M) = **no refund, no restock** — silently dropped.
- Accepted-qty input = **number field, bounded 0..returnQty**. `0` ⇒ no refund / no
  stock change for that item (like NOT_RECEIVED for quantity purposes).
- Full refund overrides QC reductions but **shipping is never refunded**.
- Shipping refund is **removed from the entire return flow**, not just the
  full-refund path.

## Data Model — `ReturnRequestModel.js`

Return item subdocument gains:

```js
acceptedQty: { type: Number }, // QC'd quantity actually accepted; ≤ returnQty.
                               // Unset ⇒ falls back to returnQty everywhere.
```

Return-level field gains:

```js
fullRefundOverride: { type: Boolean, default: false },
// Admin chose to refund all item units at paid price, ignoring QC reductions.
```

`shippingRefundAmount` stays in the schema for historical records but is always
set/treated as `0` going forward.

## Pricing — `returnPricing.js`

New helper:

```js
export const resolveQcQty = (item) =>
  Number.isFinite(item?.acceptedQty)
    ? item.acceptedQty
    : (Number(item?.returnQty) || 0);
```

`computeReturnRefund(returnRequest)` reads `returnRequest.fullRefundOverride`
internally (no new parameter at call sites):

- **QC-adjusted (default):** each refundable item (not UNSELLABLE/NOT_RECEIVED)
  refunds `computeItemRefund(item, resolveQcQty(item))`. Shortfall and zero-disposition
  items contribute 0.
- **Full-refund (`fullRefundOverride === true`):** every item refunds
  `computeItemRefund(item, item.returnQty)` at full requested qty, ignoring
  accepted-qty shortfall and disposition zeroing.
- **Shipping:** `shippingRefund` is always `0`. Returned shape:
  `{ itemsRefund, shippingRefund: 0, total: itemsRefund }`.

Shipping helpers collapse: `shouldRefundShipping` always returns `false`.
`decideShippingRefund` / `SELLER_FAULT_REASONS` are no longer used for refund math;
keep or remove with their callers as the implementation plan dictates.

## Backend Integration

### QC PATCH — `updateQCDisposition` (returnController.js)
Accept optional `acceptedQty` per item alongside `disposition`/`notes`. Validate per
item: integer, `0 ≤ acceptedQty ≤ returnQty`; reject with a clear message otherwise.
Persist on the subdoc. Unset ⇒ falls back to `returnQty`.

### Stock handler — `processQCDispositions` (returnStockHandler.js)
Replace every `item.returnQty` used for stock movement with `resolveQcQty(item)`.
GOOD restocks `acceptedQty` to `quantityOnHand`; DAMAGED adds `acceptedQty` to
`damaged`. When `resolveQcQty(item) === 0`, skip the StockMovement create (no
`quantityChange: 0` noise record), matching the existing NOT_RECEIVED skip spirit.
The SKU fallback (`item.SKU || product?.SKU || 'UNKNOWN'`) remains.

### Initiate Refund — `REFUND_INITIATED` (returnController.js + updateReturnStatus)
- `updateReturnStatus` reads `req.body.fullRefundOverride` and persists it before
  computing the refund.
- `refundAmount = itemsRefund` from the updated `computeReturnRefund`.
- Ledger post drops shipping: `totalRefund = refundAmount` (no `+ shippingRefundAmount`).
- `shippingRefundAmount` is forced to `0` at create time.

### Validation
`validateQCCompleteness` unchanged (disposition-based). Accepted-qty is optional and
defaults safely.

## Admin UI

### `QCDispositionForm.js`
Add an **Accepted Qty** number input per item: default `returnQty`, `min=0`,
`max=returnQty`. Include in the per-item payload
`{ itemId, disposition, notes, acceptedQty }`. Keep the "all dispositions filled"
guard; add a guard that each `acceptedQty` is within `0..returnQty`.

### `ReturnDetailScreen.js`
- QC read-only table: add an "Accepted" column (`acceptedQty ?? returnQty`); base the
  per-row refund display on accepted qty.
- Initiate Refund (RETURN type): confirm dialog with a **"Refund in full (ignore QC
  reductions)"** checkbox, default unchecked. Pass
  `handleStatusUpdate('REFUND_INITIATED', { fullRefundOverride })`.
- Financials card: remove the **Shipping Refund** line; "Total Refund" = item refund.
- Refund modal: drop the "Shipping refund … added automatically" helper text.

## Out of Scope

- Client (`school-uniforms-frontend`) changes: the client return UI shows no shipping-
  refund line and uses item-only estimates, so no client change is required.
- Splitting one return line across multiple dispositions (considered, rejected).
- Accepting more units than requested (`acceptedQty > returnQty`) — disallowed.

## Testing

- `returnPricing.test.js`: extend with `resolveQcQty` fallback; `computeReturnRefund`
  QC-adjusted vs full-refund; shipping always 0.
- QC PATCH validation: `acceptedQty` bounds (reject < 0, > returnQty, non-integer).
- Stock handler: `acceptedQty < returnQty` restocks only accepted; `acceptedQty === 0`
  creates no StockMovement.
- Backwards compatibility: legacy items with no `acceptedQty` behave exactly as before
  (use `returnQty`), shipping now 0.
