# QC Accepted-Qty, Full-Refund Choice, and No-Shipping-Refund Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins accept fewer units than requested during QC (refund/restock the accepted qty only), choose a full item-refund at refund time, and remove shipping refund from the entire return flow.

**Architecture:** Pure pricing logic lives in `returnPricing.js` (unit-tested, no DB). A new `resolveQcQty` helper and a `fullRefundOverride`-aware `computeReturnRefund` drive both the refund ledger and stock movements. The QC PATCH stores a per-item `acceptedQty`; the Initiate-Refund status PATCH stores `fullRefundOverride`. Admin UI gains an Accepted-Qty input and a full-refund checkbox. Shipping refund is hard-zeroed.

**Tech Stack:** Node.js (ES modules), Mongoose 5, `node:test` test runner, React 17 + react-bootstrap + Redux (admin frontend).

**Test command:** `npm test` (runs `node --test "backend/modules/returns/**/*.test.js"`)

---

## File Structure

- `backend/modules/returns/pricing/returnPricing.js` — add `resolveQcQty`; make `computeReturnRefund` honor `fullRefundOverride`; force `shippingRefund` to 0; make `shouldRefundShipping`-equivalent always false (handled in validation).
- `backend/modules/returns/pricing/returnPricing.test.js` — new + updated tests.
- `backend/modules/returns/utils/returnValidation.js` — `shouldRefundShipping` → always false.
- `backend/modules/returns/utils/returnStockHandler.js` — use `resolveQcQty`; skip zero-qty movements.
- `backend/modules/returns/controllers/returnController.js` — QC PATCH accepts/validates `acceptedQty`; Initiate-Refund reads `fullRefundOverride`; drop shipping from ledger; force `shippingRefundAmount = 0` at create.
- `backend/modules/returns/models/ReturnRequestModel.js` — add `acceptedQty` (item) and `fullRefundOverride` (root).
- `frontend/src/components/QCDispositionForm.js` — Accepted-Qty input + payload + guard.
- `frontend/src/Screens/ReturnDetailScreen.js` — Accepted column, full-refund checkbox on Initiate Refund, remove shipping line.

---

## Task 1: Add `resolveQcQty` helper to pricing

**Files:**
- Modify: `backend/modules/returns/pricing/returnPricing.js`
- Test: `backend/modules/returns/pricing/returnPricing.test.js`

- [ ] **Step 1: Write the failing test**

Add to `returnPricing.test.js` (and add `resolveQcQty` to the existing import from `./returnPricing.js`):

```js
import { resolveQcQty } from './returnPricing.js';

test('resolveQcQty: uses acceptedQty when finite', () => {
  assert.equal(resolveQcQty({ returnQty: 3, acceptedQty: 1 }), 1);
});

test('resolveQcQty: accepts 0 as a valid accepted qty', () => {
  assert.equal(resolveQcQty({ returnQty: 3, acceptedQty: 0 }), 0);
});

test('resolveQcQty: falls back to returnQty when acceptedQty unset', () => {
  assert.equal(resolveQcQty({ returnQty: 3 }), 3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `resolveQcQty is not a function` / import error.

- [ ] **Step 3: Add the helper**

In `returnPricing.js`, after `clampPct` (around line 10):

```js
/**
 * Quantity that QC accepted for an item — drives refund and restock.
 * Falls back to returnQty for legacy items with no acceptedQty.
 * @param {{ returnQty:number, acceptedQty?:number }} item
 * @returns {number}
 */
export const resolveQcQty = (item) =>
  Number.isFinite(item?.acceptedQty)
    ? item.acceptedQty
    : (Number(item?.returnQty) || 0);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all three new tests).

- [ ] **Step 5: Commit**

```bash
git add backend/modules/returns/pricing/returnPricing.js backend/modules/returns/pricing/returnPricing.test.js
git commit -m "feat(returns): add resolveQcQty helper for QC accepted quantity"
```

---

## Task 2: Make `computeReturnRefund` honor accepted qty, full-refund, and zero shipping

**Files:**
- Modify: `backend/modules/returns/pricing/returnPricing.js:63-76`
- Test: `backend/modules/returns/pricing/returnPricing.test.js`

- [ ] **Step 1: Update the existing shipping test (it will change), and add new tests**

Replace the existing `computeReturnRefund: NOT_RECEIVED and UNSELLABLE contribute 0` test's shipping assertions and add full-refund + accepted-qty tests:

```js
test('computeReturnRefund: shipping is always 0', () => {
  const ret = {
    items: [{ price: 1000, disc: 0, returnQty: 1, qcDisposition: 'GOOD' }],
    shippingRefundAmount: 50,
  };
  const r = computeReturnRefund(ret);
  assert.equal(r.shippingRefund, 0);
  assert.equal(r.total, r.itemsRefund);
});

test('computeReturnRefund: QC-adjusted uses acceptedQty', () => {
  const ret = {
    items: [{ price: 1000, disc: 0, returnQty: 3, acceptedQty: 1, qcDisposition: 'GOOD' }],
  };
  assert.equal(computeReturnRefund(ret).itemsRefund, 1000); // 1 of 3 accepted
});

test('computeReturnRefund: acceptedQty 0 contributes 0', () => {
  const ret = {
    items: [{ price: 1000, disc: 0, returnQty: 2, acceptedQty: 0, qcDisposition: 'GOOD' }],
  };
  assert.equal(computeReturnRefund(ret).itemsRefund, 0);
});

test('computeReturnRefund: fullRefundOverride ignores accepted qty and disposition', () => {
  const ret = {
    fullRefundOverride: true,
    items: [
      { price: 1000, disc: 0, returnQty: 3, acceptedQty: 1, qcDisposition: 'UNSELLABLE' }, // full: 3000
      { price: 500, disc: 0, returnQty: 1, qcDisposition: 'NOT_RECEIVED' },               // full: 500
    ],
    shippingRefundAmount: 99,
  };
  const r = computeReturnRefund(ret);
  assert.equal(r.itemsRefund, 3500);
  assert.equal(r.shippingRefund, 0);
  assert.equal(r.total, 3500);
});
```

Also update the existing `NOT_RECEIVED and UNSELLABLE contribute 0` test so its shipping/total assertions become `shippingRefund === 0` and `total === 2000` (was 2050).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — shipping still 50, no `acceptedQty`/`fullRefundOverride` handling.

- [ ] **Step 3: Update `computeReturnRefund`**

Replace lines 63–76 of `returnPricing.js`:

```js
export const computeReturnRefund = (returnRequest) => {
  const items = returnRequest?.items || [];
  const fullRefund = returnRequest?.fullRefundOverride === true;

  const itemsRefund = round2(
    items.reduce((sum, item) => {
      // Full refund: every item at full requested qty, ignore disposition zeroing.
      if (fullRefund) {
        return sum + computeItemRefund(item, item.returnQty);
      }
      // QC-adjusted: only refundable dispositions, at the accepted quantity.
      return isItemRefundable(item)
        ? sum + computeItemRefund(item, resolveQcQty(item))
        : sum;
    }, 0)
  );

  // Shipping is never refunded.
  return { itemsRefund, shippingRefund: 0, total: itemsRefund };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all computeReturnRefund tests, including updated ones).

- [ ] **Step 5: Commit**

```bash
git add backend/modules/returns/pricing/returnPricing.js backend/modules/returns/pricing/returnPricing.test.js
git commit -m "feat(returns): QC-adjusted/full refund modes; shipping never refunded"
```

---

## Task 3: Force `shouldRefundShipping` to always return false

**Files:**
- Modify: `backend/modules/returns/utils/returnValidation.js`

> Note: `decideShippingRefund` and `SELLER_FAULT_REASONS` in `returnPricing.js` are left in place (still exported/tested) but are no longer used for refund math. `shouldRefundShipping` is the single async entry point callers use at create time.

- [ ] **Step 1: Locate `shouldRefundShipping`**

Run: `grep -n "shouldRefundShipping" backend/modules/returns/utils/returnValidation.js`
Expected: its definition line(s).

- [ ] **Step 2: Replace its body to always return false**

Replace the `shouldRefundShipping` function body with:

```js
/**
 * Shipping is never refunded on returns (policy: only the discounted item
 * amount is refundable). Kept as an async no-op so existing call sites and
 * their awaits remain unchanged.
 */
export const shouldRefundShipping = async () => false;
```

- [ ] **Step 3: Verify nothing else broke**

Run: `node --check backend/modules/returns/utils/returnValidation.js && npm test`
Expected: syntax OK; all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/modules/returns/utils/returnValidation.js
git commit -m "feat(returns): shouldRefundShipping always false (no shipping refund)"
```

---

## Task 4: Add `acceptedQty` and `fullRefundOverride` to the schema

**Files:**
- Modify: `backend/modules/returns/models/ReturnRequestModel.js:44-46` (item) and the root schema.

- [ ] **Step 1: Add `acceptedQty` to the item subdocument**

After line 46 (`returnQty: { type: Number, required: true },`):

```js
    // QC accepted quantity (≤ returnQty). Unset ⇒ falls back to returnQty.
    acceptedQty: { type: Number },
```

- [ ] **Step 2: Add `fullRefundOverride` to the root schema**

Add near the refund fields on the root schema (e.g. next to `refundAmount` / `shippingRefundAmount`):

```js
    // Admin chose to refund all item units at paid price, ignoring QC reductions.
    fullRefundOverride: { type: Boolean, default: false },
```

- [ ] **Step 3: Verify schema loads**

Run: `node --check backend/modules/returns/models/ReturnRequestModel.js`
Expected: syntax OK.

- [ ] **Step 4: Commit**

```bash
git add backend/modules/returns/models/ReturnRequestModel.js
git commit -m "feat(returns): add acceptedQty (item) and fullRefundOverride (return) fields"
```

---

## Task 5: QC PATCH accepts and validates `acceptedQty`

**Files:**
- Modify: `backend/modules/returns/controllers/returnController.js:591-637` (`updateQCDisposition`)

- [ ] **Step 1: Accept and validate `acceptedQty` per item**

In the `for (const qcItem of items)` loop, after the disposition-valid check and after `const returnItem = returnRequest.items.id(qcItem.itemId);` (and its not-found guard), add:

```js
    if (qcItem.acceptedQty !== undefined) {
      const aq = Number(qcItem.acceptedQty);
      if (!Number.isInteger(aq) || aq < 0 || aq > returnItem.returnQty) {
        res.status(400);
        throw new Error(
          `Accepted qty for "${returnItem.productName}" (${returnItem.size}) must be an integer between 0 and ${returnItem.returnQty}`
        );
      }
      returnItem.acceptedQty = aq;
    }
```

Keep the existing `returnItem.qcDisposition = qcItem.disposition;` and notes assignment.

- [ ] **Step 2: Verify syntax**

Run: `node --check backend/modules/returns/controllers/returnController.js`
Expected: syntax OK.

- [ ] **Step 3: Manual sanity (no DB unit test for this controller — matches repo convention)**

Confirm by reading: `acceptedQty` is stored only when provided, clamped to `0..returnQty`, integer-only. Unset path unchanged.

- [ ] **Step 4: Commit**

```bash
git add backend/modules/returns/controllers/returnController.js
git commit -m "feat(returns): QC disposition PATCH accepts validated acceptedQty"
```

---

## Task 6: Stock handler uses accepted qty and skips zero-qty movements

**Files:**
- Modify: `backend/modules/returns/utils/returnStockHandler.js`

- [ ] **Step 1: Import `resolveQcQty`**

At the top of `returnStockHandler.js`, add to the imports:

```js
import { resolveQcQty } from '../pricing/returnPricing.js';
```

- [ ] **Step 2: Compute the accepted qty once per item and short-circuit zero**

After `const movementSKU = item.SKU || product?.SKU || 'UNKNOWN';` (line ~69), add:

```js
    const qty = resolveQcQty(item);
    if (qty <= 0) {
      // Nothing accepted for this item — no stock movement, no refund qty.
      results.push({
        product: item.product,
        size: item.size,
        disposition: item.qcDisposition,
        action: 'zero_accepted_qty',
      });
      processed++;
      continue;
    }
```

- [ ] **Step 3: Replace `item.returnQty` with `qty` in the GOOD and DAMAGED branches**

In the GOOD branch: `increments: { quantityOnHand: qty }`, `quantityChange: qty`, `newStock: previousStock + qty`, and the `results.push` `qty: qty`.

In the DAMAGED branch: `increments: { damaged: qty }`, `quantityChange: qty`, `newStock: (sizeVariant?.damaged || 0) + qty`, and `results.push` `qty: qty`.

Leave UNSELLABLE as-is (`quantityChange: 0`, write-off) — it represents accepted-but-unsellable units; its refund is already zeroed by disposition.

- [ ] **Step 4: Verify syntax**

Run: `node --check backend/modules/returns/utils/returnStockHandler.js`
Expected: syntax OK.

- [ ] **Step 5: Commit**

```bash
git add backend/modules/returns/utils/returnStockHandler.js
git commit -m "feat(returns): restock accepted qty only; skip zero-qty stock movements"
```

---

## Task 7: Initiate-Refund reads `fullRefundOverride`; ledger drops shipping; create forces shipping 0

**Files:**
- Modify: `backend/modules/returns/controllers/returnController.js` — `updateReturnStatus` `REFUND_INITIATED` case (lines 439-485); `createReturnRequest` (line ~144); `createMyReturnRequest` (line ~1127).

- [ ] **Step 1: Persist `fullRefundOverride` at the start of the `REFUND_INITIATED` case**

At the top of `case 'REFUND_INITIATED': {` (after the H4 exchange guard, before `computeReturnRefund`), add:

```js
      if (req.body.fullRefundOverride !== undefined) {
        returnRequest.fullRefundOverride = req.body.fullRefundOverride === true;
      }
```

- [ ] **Step 2: Drop shipping from the ledger post**

In the same case, replace the ledger block (lines ~474-483) so `totalRefund` no longer adds shipping:

```js
      if (!returnRequest.refundLedgerPosted) {
        const order = await Order.findById(returnRequest.order);
        const totalRefund = Number(returnRequest.refundAmount.toFixed(2)); // shipping never refunded
        validateRefundTotal(order, totalRefund);
        order.totalRefundedSoFar = (order.totalRefundedSoFar || 0) + totalRefund;
        await order.save();
        returnRequest.refundLedgerPosted = true;
      }
```

- [ ] **Step 3: Force `shippingRefundAmount = 0` at create time (both paths)**

In `createReturnRequest`, replace the shipping block (lines ~142-146):

```js
    // Shipping is never refunded on returns.
    const shippingRefundAmount = 0;
```

(Delete the `const refundShipping = await shouldRefundShipping(...)` line in this path.)

In `createMyReturnRequest`, replace lines ~1126-1127 similarly:

```js
    const shippingRefundAmount = 0;
```

(Delete its `const refundShipping = await shouldRefundShipping(...)` line.)

Leave the `shippingRefundAmount` field in the `ReturnRequest.create({...})` calls (now always 0).

- [ ] **Step 4: Verify syntax and tests**

Run: `node --check backend/modules/returns/controllers/returnController.js && npm test`
Expected: syntax OK; all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/modules/returns/controllers/returnController.js
git commit -m "feat(returns): full-refund choice at refund time; remove shipping from ledger and create"
```

---

## Task 8: QC form — Accepted-Qty input

**Files:**
- Modify: `frontend/src/components/QCDispositionForm.js`

- [ ] **Step 1: Track acceptedQty in form state**

In the `useState` initializer, add `acceptedQty` defaulting to the item's `returnQty`:

```js
    items.map((item) => ({
        itemId: item._id || item.itemId,
        disposition: item.qcDisposition || '',
        notes: item.qcNotes || '',
        acceptedQty: item.acceptedQty ?? item.returnQty ?? 0,
    }))
```

- [ ] **Step 2: Add a change handler**

After `handleNotesChange`:

```js
    const handleAcceptedQtyChange = (index, value) => {
        setDispositions((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], acceptedQty: value === '' ? '' : Number(value) };
            return updated;
        });
    };
```

- [ ] **Step 3: Add the input column**

Add a header `<th>Accepted Qty</th>` after the `Qty` header, and in the row (after the Qty `<td>`):

```jsx
                            <td style={{ maxWidth: 90 }}>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    max={item.returnQty}
                                    value={dispositions[index]?.acceptedQty}
                                    onChange={(e) => handleAcceptedQtyChange(index, e.target.value)}
                                />
                            </td>
```

- [ ] **Step 4: Guard on submit**

In `handleSubmit`, after the `allFilled` check, add:

```js
        const qtyOk = dispositions.every((d, i) => {
            const max = items[i].returnQty;
            return Number.isInteger(Number(d.acceptedQty)) && d.acceptedQty >= 0 && d.acceptedQty <= max;
        });
        if (!qtyOk) {
            alert('Accepted qty must be a whole number between 0 and the return qty for every item.');
            return;
        }
```

- [ ] **Step 5: Verify build**

Run: `cd frontend && npx eslint src/components/QCDispositionForm.js`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/QCDispositionForm.js
git commit -m "feat(returns-admin): accepted-qty input in QC disposition form"
```

---

## Task 9: Return detail — Accepted column, full-refund checkbox, remove shipping line

**Files:**
- Modify: `frontend/src/Screens/ReturnDetailScreen.js`

- [ ] **Step 1: Add full-refund state**

With the other `useState` hooks (around line 54):

```js
    const [fullRefundOverride, setFullRefundOverride] = useState(false);
```

- [ ] **Step 2: Co-locate the full-refund checkbox with the Initiate Refund action and pass it through**

The full-refund choice belongs to the **Initiate Refund** status transition (not the Record-Refund modal, which only PATCHes refund details). Render a small inline checkbox next to the Initiate Refund button so it's visible at the moment of the decision.

Replace the Initiate Refund button block (lines 272-282) with a checkbox + button pair:

```jsx
                {nextStatuses.includes('REFUND_INITIATED') &&
                 !(['EXCHANGE', 'REPLACEMENT'].includes(ret.type) && ret.exchangeOrderId) && (
                    <span className="mr-2 mb-1 d-inline-flex align-items-center" style={{ gap: '8px' }}>
                        <Form.Check
                            type="checkbox"
                            id="full-refund-override"
                            label="Full refund"
                            checked={fullRefundOverride}
                            onChange={(e) => setFullRefundOverride(e.target.checked)}
                        />
                        <Button
                            variant="success"
                            onClick={() => handleStatusUpdate('REFUND_INITIATED', { fullRefundOverride })}
                            disabled={statusLoading}
                        >
                            Initiate Refund
                        </Button>
                    </span>
                )}
```

`Form` is already imported from `react-bootstrap` at the top of the file (used by the modals), so `Form.Check` is available here.

- [ ] **Step 3: Add Accepted column to the QC read-only table**

In the QC read-only `<thead>` (around line 530), add `<th>Accepted</th>` after the `Qty` header. In the body row, after the Qty `<td>`:

```jsx
                                                            <td>{item.acceptedQty ?? item.returnQty}</td>
```

And base the refund cell on accepted qty: it already shows `₹{item.refundAmount}`, which the backend recomputes at refund time — leave as-is (refundAmount reflects the stored snapshot).

- [ ] **Step 4: Remove the Shipping Refund line and simplify Total in the Financials card**

In the Financials card (lines 405-408), delete the shipping-refund `<p>` block and change Total to:

```jsx
                                            <p><strong>Total Refund:</strong> ₹{ret.refundAmount || 0}</p>
```

- [ ] **Step 5: Update the Refund modal helper text**

Change the helper text (line ~698-700) to drop the shipping mention:

```jsx
                                <Form.Text className="text-muted">
                                    Amount calculated from QC results.
                                </Form.Text>
```

- [ ] **Step 6: Verify build**

Run: `cd frontend && npx eslint src/Screens/ReturnDetailScreen.js`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/Screens/ReturnDetailScreen.js
git commit -m "feat(returns-admin): accepted column, full-refund toggle, remove shipping refund display"
```

---

## Task 10: End-to-end verification on staging

**Files:** none (manual + observation).

- [ ] **Step 1: Restart backend so all changes load**

Run: `touch backend/server.js` (nodemon reload) — confirm a new server PID via `ps aux | grep "backend/server server.js"`.

- [ ] **Step 2: Walk return RET-20260602-00002 through QC**

Mark Received → Start QC → set dispositions, set one item's Accepted Qty below its return qty → Complete QC. Confirm: status → QC_COMPLETED, StockMovement created only for accepted qty, no movement for the reduced units.

- [ ] **Step 3: Initiate refund both ways on a test return**

Once at QC_COMPLETED: Initiate Refund with the full-refund checkbox OFF → refund = QC-adjusted item amount, shipping not added. Then on another test return, ON → refund = all units at paid price. Confirm Financials shows no shipping line and Total = item refund.

- [ ] **Step 4: Confirm legacy compatibility**

Confirm a return created before this change (no `acceptedQty`) still refunds/restocks at `returnQty`.

---

## Self-Review Notes

- **Spec coverage:** accepted-qty (Tasks 1,2,4,5,6,8,9), full-refund (Tasks 2,4,7,9), no-shipping (Tasks 2,3,7,9). All covered.
- **Type consistency:** `resolveQcQty`, `acceptedQty`, `fullRefundOverride` used identically across pricing, stock handler, controller, schema, and UI.
- **Credit-note / email helpers:** their `shippingRefundAmount > 0` branches become dead code (value always 0); no change required, left untouched to avoid scope creep.
- **No retroactive ledger reversal:** already-completed returns keep historical shipping refunds; out of scope per spec.
