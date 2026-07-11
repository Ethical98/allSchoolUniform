# Return Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a single source-of-truth refund pricing module and harden the return schema so refund math stops drifting and silent field drops stop happening.

**Architecture:** Add a pure (no-DB) `returnPricing.js` module that owns every refund calculation, then refactor the three existing inline-formula sites and the credit-note helper to call it. Add the missing declared fields to `ReturnRequestModel`. This is Plan 1 of 4 (foundation); Plans 2–4 (state machine/endpoints, client, admin) build on it. Spec: `backend/docs/superpowers/specs/2026-06-02-return-module-redesign.md` (root-causes RC1 + RC3; findings H1, H5, H6, H8, L1, L2, C3, M2, M3).

**Tech Stack:** Node.js (ESM, `"type":"module"`), Express, Mongoose 5.12, Node built-in test runner (`node --test`, Node 24 installed — no new dependency).

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `backend/modules/returns/pricing/returnPricing.js` | Single source of truth: per-item refund, total refund honoring QC dispositions, modified-order item resolution (M3), shipping-refund rule | **Create** |
| `backend/modules/returns/pricing/returnPricing.test.js` | Unit tests for the pricing module (pure, no DB) | **Create** |
| `backend/modules/returns/models/ReturnRequestModel.js` | Add declared fields: `evidenceImages`, `reverseShipping.pickupInitiatedAt`, `refundInitiatedAt` (keep `refundProcessedAt`) | **Modify** |
| `backend/modules/returns/controllers/returnController.js` | Replace 3 inline refund formulas with pricing-module calls (`:76-78`, `:438-442`, `:1076-1077`) | **Modify** |
| `backend/modules/returns/utils/returnCreditNoteHelper.js` | Skip UNSELLABLE (not just NOT_RECEIVED) using the shared rule (H6) | **Modify** |
| `backend/modules/returns/utils/returnValidation.js` | Re-export `shouldRefundShipping` from pricing module to avoid a second copy | **Modify** |
| `package.json` (repo root `/Users/devansh/Desktop/asu`) | Add a `test` script that runs the return test files | **Modify** |

**Design note — `disc` is the canonical field.** Order items use `price` (MRP) + `disc` (discount %) + `tax` (%). There is no `discount` field on order items (that name exists only on the client type, L2). The pricing module reads `disc` and treats `discount` as a fallback alias so it is robust to both shapes.

**Refund rule (authoritative):** `unitRefund = round2(price × (1 − clamp(disc,0,100)/100))`; item refund = `unitRefund × returnQty`. For a return item with a QC disposition, `NOT_RECEIVED` and `UNSELLABLE` contribute `0`. Shipping is refunded when the reason is seller-fault (`DEFECTIVE`, `WRONG_ITEM`, `DAMAGED_IN_TRANSIT`) OR every order item is fully returned.

---

## Task 1: Create the pricing module with `computeItemRefund`

**Files:**
- Create: `backend/modules/returns/pricing/returnPricing.js`
- Test: `backend/modules/returns/pricing/returnPricing.test.js`

- [ ] **Step 1: Write the failing test**

Create `backend/modules/returns/pricing/returnPricing.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeItemRefund } from './returnPricing.js';

test('computeItemRefund: price × (1 - disc%) × qty, rounded to 2dp', () => {
  // 1000 MRP, 10% off = 900/unit, x2 = 1800
  assert.equal(computeItemRefund({ price: 1000, disc: 10 }, 2), 1800);
});

test('computeItemRefund: no discount', () => {
  assert.equal(computeItemRefund({ price: 499, disc: 0 }, 1), 499);
});

test('computeItemRefund: missing disc treated as 0', () => {
  assert.equal(computeItemRefund({ price: 250 }, 3), 750);
});

test('computeItemRefund: discount clamped to 0..100', () => {
  assert.equal(computeItemRefund({ price: 100, disc: 150 }, 1), 0);
  assert.equal(computeItemRefund({ price: 100, disc: -50 }, 1), 100);
});

test('computeItemRefund: accepts `discount` alias when `disc` absent', () => {
  assert.equal(computeItemRefund({ price: 200, discount: 50 }, 1), 100);
});

test('computeItemRefund: rounds half to 2 decimals', () => {
  // 333 * (1 - 0.15) = 283.05, x1
  assert.equal(computeItemRefund({ price: 333, disc: 15 }, 1), 283.05);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/modules/returns/pricing/returnPricing.test.js`
Expected: FAIL — `Cannot find module './returnPricing.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `backend/modules/returns/pricing/returnPricing.js`:

```javascript
/**
 * Return refund pricing — the single source of truth for all refund math.
 * Pure module: no DB access, no Mongoose. Safe to unit-test in isolation.
 *
 * Order/return items use field names: price (MRP), disc (discount %), tax (rate %).
 */

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const clampPct = (n) => Math.max(0, Math.min(100, Number(n) || 0));

/**
 * Refund for a single line: price × (1 - disc%) × qty, rounded to 2dp.
 * Accepts `disc` (canonical) or `discount` (alias) for the discount percent.
 * @param {{ price:number, disc?:number, discount?:number }} item
 * @param {number} returnQty
 * @returns {number}
 */
export const computeItemRefund = (item, returnQty) => {
  const price = Number(item?.price) || 0;
  const disc = clampPct(item?.disc ?? item?.discount ?? 0);
  const unit = round2(price * (1 - disc / 100));
  return round2(unit * (Number(returnQty) || 0));
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/modules/returns/pricing/returnPricing.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/modules/returns/pricing/returnPricing.js backend/modules/returns/pricing/returnPricing.test.js
git commit -m "feat(returns): add returnPricing.computeItemRefund single source of truth"
```

---

## Task 2: Add `resolveOrderItems` (M3 — modified-order source of truth)

**Files:**
- Modify: `backend/modules/returns/pricing/returnPricing.js`
- Test: `backend/modules/returns/pricing/returnPricing.test.js`

- [ ] **Step 1: Write the failing test**

Append to `returnPricing.test.js`:

```javascript
import { resolveOrderItems } from './returnPricing.js';

test('resolveOrderItems: uses modifiedItems when order.modified is true and non-empty', () => {
  const order = {
    modified: true,
    orderItems: [{ product: 'a', size: 'M', qty: 1 }],
    modifiedItems: [{ product: 'b', size: 'L', qty: 2 }],
  };
  assert.deepEqual(resolveOrderItems(order), order.modifiedItems);
});

test('resolveOrderItems: falls back to orderItems when not modified', () => {
  const order = {
    modified: false,
    orderItems: [{ product: 'a', size: 'M', qty: 1 }],
    modifiedItems: [],
  };
  assert.deepEqual(resolveOrderItems(order), order.orderItems);
});

test('resolveOrderItems: falls back to orderItems when modified but modifiedItems empty', () => {
  const order = {
    modified: true,
    orderItems: [{ product: 'a', size: 'M', qty: 1 }],
    modifiedItems: [],
  };
  assert.deepEqual(resolveOrderItems(order), order.orderItems);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/modules/returns/pricing/returnPricing.test.js`
Expected: FAIL — `resolveOrderItems is not a function` (or import error).

- [ ] **Step 3: Write minimal implementation**

Append to `returnPricing.js`:

```javascript
/**
 * Which item list is the source of truth for a return.
 * M3: when the order was modified post-purchase, return against what was
 * actually billed/shipped (modifiedItems); otherwise the original orderItems.
 * @param {{ modified?:boolean, orderItems:Array, modifiedItems?:Array }} order
 * @returns {Array}
 */
export const resolveOrderItems = (order) => {
  if (order?.modified && Array.isArray(order.modifiedItems) && order.modifiedItems.length > 0) {
    return order.modifiedItems;
  }
  return order?.orderItems || [];
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/modules/returns/pricing/returnPricing.test.js`
Expected: PASS (9 tests total).

- [ ] **Step 5: Commit**

```bash
git add backend/modules/returns/pricing/returnPricing.js backend/modules/returns/pricing/returnPricing.test.js
git commit -m "feat(returns): resolveOrderItems honors modifiedItems (M3)"
```

---

## Task 3: Add `computeReturnRefund` (honors QC dispositions — H5)

**Files:**
- Modify: `backend/modules/returns/pricing/returnPricing.js`
- Test: `backend/modules/returns/pricing/returnPricing.test.js`

- [ ] **Step 1: Write the failing test**

Append to `returnPricing.test.js`:

```javascript
import { computeReturnRefund } from './returnPricing.js';

test('computeReturnRefund: sums item refunds, no QC dispositions yet', () => {
  const ret = {
    items: [
      { price: 1000, disc: 10, returnQty: 1 }, // 900
      { price: 500, disc: 0, returnQty: 2 },   // 1000
    ],
    shippingRefundAmount: 0,
  };
  const r = computeReturnRefund(ret);
  assert.equal(r.itemsRefund, 1900);
  assert.equal(r.shippingRefund, 0);
  assert.equal(r.total, 1900);
});

test('computeReturnRefund: NOT_RECEIVED and UNSELLABLE contribute 0', () => {
  const ret = {
    items: [
      { price: 1000, disc: 0, returnQty: 1, qcDisposition: 'GOOD' },        // 1000
      { price: 1000, disc: 0, returnQty: 1, qcDisposition: 'DAMAGED' },     // 1000
      { price: 1000, disc: 0, returnQty: 1, qcDisposition: 'UNSELLABLE' },  // 0
      { price: 1000, disc: 0, returnQty: 1, qcDisposition: 'NOT_RECEIVED' },// 0
    ],
    shippingRefundAmount: 50,
  };
  const r = computeReturnRefund(ret);
  assert.equal(r.itemsRefund, 2000);
  assert.equal(r.shippingRefund, 50);
  assert.equal(r.total, 2050);
});

test('computeReturnRefund: PENDING/GOOD treated as refundable', () => {
  const ret = {
    items: [
      { price: 100, disc: 0, returnQty: 1, qcDisposition: 'PENDING' }, // 100
    ],
  };
  assert.equal(computeReturnRefund(ret).itemsRefund, 100);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/modules/returns/pricing/returnPricing.test.js`
Expected: FAIL — `computeReturnRefund is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `returnPricing.js`:

```javascript
// Dispositions that produce zero refund (item not refundable).
const ZERO_REFUND_DISPOSITIONS = new Set(['NOT_RECEIVED', 'UNSELLABLE']);

/**
 * True when a return item should be refunded given its QC disposition.
 * Items with no disposition yet (undefined/PENDING) are refundable.
 */
export const isItemRefundable = (item) =>
  !ZERO_REFUND_DISPOSITIONS.has(item?.qcDisposition);

/**
 * Total refund for a return request, honoring per-item QC dispositions.
 * Shipping refund is read from the return (set at create time by
 * shouldRefundShipping); this function does not recompute it.
 * @param {{ items:Array, shippingRefundAmount?:number }} returnRequest
 * @returns {{ itemsRefund:number, shippingRefund:number, total:number }}
 */
export const computeReturnRefund = (returnRequest) => {
  const items = returnRequest?.items || [];
  const itemsRefund = round2(
    items.reduce(
      (sum, item) =>
        isItemRefundable(item)
          ? sum + computeItemRefund(item, item.returnQty)
          : sum,
      0
    )
  );
  const shippingRefund = round2(Number(returnRequest?.shippingRefundAmount) || 0);
  return { itemsRefund, shippingRefund, total: round2(itemsRefund + shippingRefund) };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/modules/returns/pricing/returnPricing.test.js`
Expected: PASS (12 tests total).

- [ ] **Step 5: Commit**

```bash
git add backend/modules/returns/pricing/returnPricing.js backend/modules/returns/pricing/returnPricing.test.js
git commit -m "feat(returns): computeReturnRefund honors QC dispositions (UNSELLABLE/NOT_RECEIVED -> 0)"
```

---

## Task 4: Move `shouldRefundShipping` into the pricing module

The shipping rule currently lives in `returnValidation.js` and reaches into the DB via `allOrderItemsReturned`. Keep the DB-touching `allOrderItemsReturned` where it is, but make the **pure decision** (`seller-fault OR allReturned`) live in pricing so all refund logic is co-located.

**Files:**
- Modify: `backend/modules/returns/pricing/returnPricing.js`
- Test: `backend/modules/returns/pricing/returnPricing.test.js`

- [ ] **Step 1: Write the failing test**

Append to `returnPricing.test.js`:

```javascript
import { SELLER_FAULT_REASONS, decideShippingRefund } from './returnPricing.js';

test('SELLER_FAULT_REASONS contains the three seller-fault reasons', () => {
  assert.deepEqual([...SELLER_FAULT_REASONS].sort(), ['DAMAGED_IN_TRANSIT', 'DEFECTIVE', 'WRONG_ITEM']);
});

test('decideShippingRefund: seller-fault reason refunds shipping regardless of allReturned', () => {
  assert.equal(decideShippingRefund('DEFECTIVE', false), true);
});

test('decideShippingRefund: non-seller-fault refunds shipping only when all items returned', () => {
  assert.equal(decideShippingRefund('CHANGED_MIND', true), true);
  assert.equal(decideShippingRefund('CHANGED_MIND', false), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/modules/returns/pricing/returnPricing.test.js`
Expected: FAIL — `decideShippingRefund is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `returnPricing.js`:

```javascript
// Reasons where the seller is at fault → shipping is always refunded.
export const SELLER_FAULT_REASONS = new Set([
  'DEFECTIVE',
  'WRONG_ITEM',
  'DAMAGED_IN_TRANSIT',
]);

/**
 * Pure shipping-refund decision.
 * @param {string} reason - return reason
 * @param {boolean} allItemsReturned - whether every order item is fully returned
 * @returns {boolean}
 */
export const decideShippingRefund = (reason, allItemsReturned) =>
  SELLER_FAULT_REASONS.has(reason) || Boolean(allItemsReturned);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/modules/returns/pricing/returnPricing.test.js`
Expected: PASS (15 tests total).

- [ ] **Step 5: Refactor `returnValidation.js` to delegate (no behavior change)**

In `backend/modules/returns/utils/returnValidation.js`, replace the local `SELLER_FAULT_REASONS` array (lines ~5-9) and the body of `shouldRefundShipping` (lines ~205-210) so the decision routes through pricing. Keep `allOrderItemsReturned` (it does the DB work) in this file.

Replace the top-of-file constant:

```javascript
// (was) const SELLER_FAULT_REASONS = ['DEFECTIVE', 'WRONG_ITEM', 'DAMAGED_IN_TRANSIT'];
import { decideShippingRefund } from '../pricing/returnPricing.js';
```

Replace `shouldRefundShipping`:

```javascript
export const shouldRefundShipping = async (order, reason, pendingItems = []) => {
  if (decideShippingRefund(reason, false)) return true; // seller-fault short-circuit
  return await allOrderItemsReturned(order, pendingItems);
};
```

- [ ] **Step 6: Run the full return test file + a syntax check on validation**

Run: `node --test backend/modules/returns/pricing/returnPricing.test.js`
Expected: PASS (15).
Run: `node --check backend/modules/returns/utils/returnValidation.js`
Expected: no output (valid syntax).

- [ ] **Step 7: Commit**

```bash
git add backend/modules/returns/pricing/returnPricing.js backend/modules/returns/pricing/returnPricing.test.js backend/modules/returns/utils/returnValidation.js
git commit -m "refactor(returns): centralize shipping-refund decision in returnPricing"
```

---

## Task 5: Wire a `test` script (repo root)

**Files:**
- Modify: `/Users/devansh/Desktop/asu/package.json`

- [ ] **Step 1: Replace the stub test script**

In `/Users/devansh/Desktop/asu/package.json`, change line 21 from:

```json
    "test": "echo \"Error: no test specified\" && exit 1"
```

to:

```json
    "test": "node --test backend/modules/returns/**/*.test.js",
    "test:returns": "node --test backend/modules/returns/**/*.test.js"
```

- [ ] **Step 2: Run it**

Run: `npm test`
Expected: PASS — 15 tests from `returnPricing.test.js`. (Node 24 expands the `**` glob; if the installed shell does not, fall back to `node --test backend/modules/returns/pricing/returnPricing.test.js` and note it in the commit.)

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add node --test runner script for return module tests"
```

---

## Task 6: Refactor customer-create refund to use the pricing module

The customer create path (`createMyReturnRequest`, `returnController.js:1070-1099`) inlines `price × (1 - disc/100)` and resolves items only against `order.orderItems`. Route it through the pricing module so it gets M3 + the canonical rounding.

**Files:**
- Modify: `backend/modules/returns/controllers/returnController.js`

- [ ] **Step 1: Add the import at the top of the controller**

After the existing return-util imports (near `returnController.js:16`), add:

```javascript
import {
  computeItemRefund,
  resolveOrderItems,
} from '../pricing/returnPricing.js';
```

- [ ] **Step 2: Replace item resolution + refund calc in `createMyReturnRequest`**

Replace the block at `returnController.js:1070-1092` (the `const returnItems = items.map(...)` that finds items in `order.orderItems` and computes `discountedPrice`/`refundAmount`) with:

```javascript
    const sourceItems = resolveOrderItems(order); // M3: modifiedItems when modified
    const returnItems = items.map((reqItem) => {
      const orderItem = sourceItems.find(
        (oi) => oi._id.toString() === reqItem.orderItemId
      );
      if (!orderItem) throw new Error(`Order item ${reqItem.orderItemId} not found in order`);

      return {
        product: orderItem.product,
        productName: orderItem.name,
        SKU: orderItem.productCode || '',
        size: orderItem.size,
        image: orderItem.image,
        originalQty: orderItem.qty,
        returnQty: reqItem.returnQty,
        price: orderItem.price,
        disc: orderItem.disc || 0,
        tax: orderItem.tax || 0,
        refundAmount: computeItemRefund(orderItem, reqItem.returnQty),
      };
    });
```

- [ ] **Step 3: Replace the total calc in `createMyReturnRequest`**

Replace `returnController.js:1099` (`const totalRefundAmount = returnItems.reduce(...)`) with a reduce over the now-canonical per-item amounts (kept inline — it is a trivial sum of already-correct values):

```javascript
    const totalRefundAmount = returnItems.reduce((sum, item) => sum + item.refundAmount, 0);
```

(Unchanged in form, but now summing pricing-module outputs. Leave the later `refundAmount: Number(totalRefundAmount.toFixed(2))` as-is.)

- [ ] **Step 4: Verify syntax**

Run: `node --check backend/modules/returns/controllers/returnController.js`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add backend/modules/returns/controllers/returnController.js
git commit -m "refactor(returns): customer create uses returnPricing + resolveOrderItems (M3)"
```

---

## Task 7: Refactor admin-create + REFUND_INITIATED recompute to use the pricing module

**Files:**
- Modify: `backend/modules/returns/controllers/returnController.js`

- [ ] **Step 1: Replace admin-create refund calc**

In `createReturnRequest`, replace the inline `discountedPrice`/`refundAmount` at `returnController.js:76-78` so the item build uses the module. Inside the `items.map((reqItem) => {...})` (line ~69), change the resolution to use `resolveOrderItems(order)` and the refund to `computeItemRefund`:

```javascript
    const sourceItems = resolveOrderItems(order); // M3
    const returnItems = items.map((reqItem) => {
      const orderItem = sourceItems.find(
        (oi) =>
          oi.product.toString() === reqItem.product.toString() &&
          oi.size === reqItem.size
      );

      return {
        product: orderItem.product,
        productName: orderItem.name,
        SKU: orderItem.productCode || '',
        size: orderItem.size,
        image: orderItem.image,
        originalQty: orderItem.qty,
        returnQty: reqItem.returnQty,
        price: orderItem.price,
        disc: orderItem.disc || 0,
        tax: orderItem.tax || 0,
        refundAmount: computeItemRefund(orderItem, reqItem.returnQty),
        ...(type === 'EXCHANGE' && reqItem.exchangeProduct
          ? {
              exchangeProduct: reqItem.exchangeProduct,
              exchangeProductName: reqItem.exchangeProductName,
              exchangeSize: reqItem.exchangeSize,
              exchangeUnitPrice: reqItem.exchangeUnitPrice,
            }
          : {}),
      };
    });
```

- [ ] **Step 2: Replace the REFUND_INITIATED effective-refund recompute**

Inside `case 'REFUND_INITIATED':`, make `computeReturnRefund` the authority. This removes the H5 fragility (UNSELLABLE is zeroed by the module, not by a prior in-memory mutation) and avoids double-adding shipping.

Replace the reduce + `refundAmount` assignment at `returnController.js:438-442`:

```javascript
      // Effective refund (items only) — module zeroes UNSELLABLE & NOT_RECEIVED.
      const { itemsRefund } = computeReturnRefund(returnRequest);
      returnRequest.refundAmount = Number(itemsRefund.toFixed(2));
```

Then replace the order-ledger block at `returnController.js:459-466` (the `const order = ...` through `await order.save();`):

```javascript
      // Update order's totalRefundedSoFar — items refund + shipping refund, once.
      const order = await Order.findById(returnRequest.order);
      const totalRefund = Number(
        (returnRequest.refundAmount + (returnRequest.shippingRefundAmount || 0)).toFixed(2)
      );
      validateRefundTotal(order, totalRefund);
      order.totalRefundedSoFar = (order.totalRefundedSoFar || 0) + totalRefund;
      await order.save();
```

Net effect: `returnRequest.refundAmount` stores the items-only figure; `shippingRefundAmount` stays separate; the order ledger is credited the combined total exactly once. The `if (!returnRequest.creditNote)` credit-note block at `:444-457` stays unchanged between these two edits.

- [ ] **Step 3: Add the `computeReturnRefund` import**

Extend the import added in Task 6 to include it:

```javascript
import {
  computeItemRefund,
  computeReturnRefund,
  resolveOrderItems,
} from '../pricing/returnPricing.js';
```

- [ ] **Step 4: Verify syntax**

Run: `node --check backend/modules/returns/controllers/returnController.js`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add backend/modules/returns/controllers/returnController.js
git commit -m "refactor(returns): admin create + REFUND_INITIATED use returnPricing (H5)"
```

---

## Task 8: Fix credit-note over-credit (H6) — skip UNSELLABLE

**Files:**
- Modify: `backend/modules/returns/utils/returnCreditNoteHelper.js`

- [ ] **Step 1: Import the shared refundability rule**

At the top of `returnCreditNoteHelper.js` (after the existing billing imports, line ~5), add:

```javascript
import { isItemRefundable } from '../pricing/returnPricing.js';
```

- [ ] **Step 2: Skip non-refundable items in `groupReturnItemsToNested`**

Replace the skip guard at `returnCreditNoteHelper.js:15-16`:

```javascript
    // Skip items that are not refundable (NOT_RECEIVED never arrived; UNSELLABLE written off)
    if (!isItemRefundable(item)) continue;
```

(Previously only `if (item.qcDisposition === 'NOT_RECEIVED') continue;` — UNSELLABLE now also excluded, so the credit-note total matches the cash refund.)

- [ ] **Step 3: Verify syntax**

Run: `node --check backend/modules/returns/utils/returnCreditNoteHelper.js`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add backend/modules/returns/utils/returnCreditNoteHelper.js
git commit -m "fix(returns): credit note excludes UNSELLABLE items to match refund (H6)"
```

---

## Task 9: Harden the schema — add the dropped/split fields (H1, H8, M2)

**Files:**
- Modify: `backend/modules/returns/models/ReturnRequestModel.js`

- [ ] **Step 1: Add `evidenceImages` to the return schema (H1)**

In `ReturnRequestModel.js`, in the top-level `returnRequestSchema`, add near `reasonDetails`:

```javascript
  // Customer-uploaded evidence photo URLs (defect/damage proof)
  evidenceImages: [{ type: String }],
```

- [ ] **Step 2: Add `pickupInitiatedAt` to `reverseShipping` (H8)**

In the `reverseShipping` sub-object, alongside `pickupScheduledDate`, add:

```javascript
    pickupInitiatedAt: { type: Date },
```

- [ ] **Step 3: Add `refundInitiatedAt` (M2)**

In the financial/refund block, just above `refundProcessedAt`, add:

```javascript
  refundInitiatedAt: { type: Date },
```

(Keep `refundProcessedAt` as-is; Plan 2 wires the two timestamps to their correct moments.)

- [ ] **Step 4: Verify syntax**

Run: `node --check backend/modules/returns/models/ReturnRequestModel.js`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add backend/modules/returns/models/ReturnRequestModel.js
git commit -m "feat(returns): declare evidenceImages, pickupInitiatedAt, refundInitiatedAt (H1,H8,M2)"
```

---

## Task 10: Add a strict-mode guard test (prevents future silent drops — RC3)

A schema-level safety net: a sub-schema with `strict: 'throw'` would surface undeclared writes as errors. Rather than flip the production schema (risky mid-flight), add a unit test that asserts the three previously-dropped fields are now part of the schema paths, so a regression (someone deleting the field) fails CI.

**Files:**
- Create: `backend/modules/returns/models/ReturnRequestModel.schema.test.js`

- [ ] **Step 1: Write the failing test**

Create `backend/modules/returns/models/ReturnRequestModel.schema.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ReturnRequest from './ReturnRequestModel.js';

test('schema declares evidenceImages (H1)', () => {
  assert.ok(ReturnRequest.schema.path('evidenceImages'), 'evidenceImages must be a declared path');
});

test('schema declares refundInitiatedAt (M2)', () => {
  assert.ok(ReturnRequest.schema.path('refundInitiatedAt'), 'refundInitiatedAt must be a declared path');
});

test('schema declares reverseShipping.pickupInitiatedAt (H8)', () => {
  assert.ok(
    ReturnRequest.schema.path('reverseShipping.pickupInitiatedAt'),
    'reverseShipping.pickupInitiatedAt must be a declared path'
  );
});
```

- [ ] **Step 2: Run test**

Run: `node --test backend/modules/returns/models/ReturnRequestModel.schema.test.js`
Expected: PASS (3 tests). Importing the model defines the schema without a DB connection (Mongoose `model()` does not connect). If the import pulls a counter `mongoose.model('ReturnCounter', ...)` that errors on re-register under the test runner, the test still passes because the file is loaded once; if a `OverwriteModelError` appears, note it and guard the counter with `mongoose.models.ReturnCounter || mongoose.model(...)` in the model (small, safe change).

- [ ] **Step 3: Commit**

```bash
git add backend/modules/returns/models/ReturnRequestModel.schema.test.js
git commit -m "test(returns): assert hardened schema paths exist (RC3 regression guard)"
```

---

## Verification (whole plan)

- [ ] Run the full suite: `npm test` → all return tests PASS (≈18: 15 pricing + 3 schema).
- [ ] Syntax-check every modified server file:
  `node --check backend/modules/returns/controllers/returnController.js && node --check backend/modules/returns/utils/returnValidation.js && node --check backend/modules/returns/utils/returnCreditNoteHelper.js && node --check backend/modules/returns/models/ReturnRequestModel.js`
  Expected: no output.
- [ ] Boot smoke (no DB writes): `node --check backend/server.js` (or start the server in a scratch env) to confirm the new imports resolve.
- [ ] Manual sanity once Plan 2 lands: create a customer return with an UNSELLABLE item routed through QC → `refundAmount` excludes it AND the generated credit note total equals the cash refund (H5 + H6 together).

## Spec coverage (self-review)

| Spec item | Task |
|---|---|
| RC1 single pricing source | 1, 3, 6, 7 |
| M3 modified-order items | 2, 6, 7 |
| H5 UNSELLABLE refund fragile | 3, 7 |
| H6 credit-note over-credit | 8 |
| Shipping rule co-located (L1 groundwork) | 4 |
| L2 `disc` canonical / `discount` alias | 1 |
| H1 evidenceImages declared | 9 |
| H8 pickupInitiatedAt declared | 9 |
| M2 refundInitiatedAt field | 9 |
| RC3 silent-drop regression guard | 10 |
| Test runner exists | 5 |

**Deferred to later plans (out of scope here):** evidence persistence wiring + enforcement C2 (Plans 2/3), H4 guard + side-effect extraction + hasReturns derivation (Plan 2), customer cancel + eligibility endpoint (Plan 2), client estimate port + copy C3/C4 (Plan 3), admin A1/A2 (Plan 4), notification completeness H7/H9 + M2 wiring (Plan 2).
