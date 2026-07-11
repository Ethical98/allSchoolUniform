# Return Backend State & Endpoints Implementation Plan (Plan 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the return state-machine and endpoint bugs — derive `hasReturns` instead of leaving it stuck true, block the EXCHANGE→REFUND double-payout, give customers a cancel + eligibility API, complete lifecycle emails, and split the refund timestamps — without restructuring the working `updateReturnStatus` switch.

**Architecture:** Targeted fixes on top of Plan 1's foundation. A new pure helper file holds the EXCHANGE→REFUND guard so it is unit-testable; a small async helper derives `order.hasReturns`. The customer cancel + eligibility handlers are added to the existing controller and wired as `/my/*` routes (before the admin auth gate). Emails gain the two missing templates with a fallback. The `updateReturnStatus` switch stays in place — we only add guard calls and timestamp lines. This is Plan 2 of 4; depends on Plan 1 (merged: `returnPricing.js`, schema fields `evidenceImages`/`pickupInitiatedAt`/`refundInitiatedAt`). Spec: `backend/docs/superpowers/specs/2026-06-02-return-module-redesign.md` (root-causes RC2, RC4, RC5; findings H2, H3, H4, H7, H9, M2; partial C1/RC5 via the eligibility endpoint).

**Tech Stack:** Node.js (ESM), Express, Mongoose 5.12, Node built-in test runner (`node --test`). Repo root / working dir: `/Users/devansh/Desktop/asu`. Branch `asu-next`.

---

## Reconciliation note (read before starting)

A prior plan `docs/superpowers/plans/2026-05-23-return-exchange-bugfix.md` was partially executed (committed WIP touches the same controller for shipping/AWB/QC fixes). It does **NOT** cover anything in Plan 2 — verified: no `hasReturns` reset, no customer cancel, no eligibility endpoint, no EXCHANGE→REFUND guard, no email completeness. So Plan 2 is non-colliding. Still, the controller is large and shared: make ONLY the edits specified, and if a quoted "current code" block does not match, STOP and report rather than guessing.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `backend/modules/returns/state/transitionGuards.js` | Pure guard(s) for state transitions; first guard: EXCHANGE/REPLACEMENT→REFUND_INITIATED blocked when a live exchange order exists (H4) | **Create** |
| `backend/modules/returns/state/transitionGuards.test.js` | Unit tests for the guard (pure, no DB) | **Create** |
| `backend/modules/returns/utils/orderReturnFlag.js` | `recomputeOrderReturnFlag(orderId)` — derive `order.hasReturns` from live returns (H3) | **Create** |
| `backend/modules/returns/controllers/returnController.js` | Call guard in `updateReturnStatus`; set M2 timestamps; recompute flag on create/cancel/reject; add `cancelMyReturnRequest` + `getMyReturnEligibility` handlers | **Modify** |
| `backend/modules/returns/routes/returnRoutes.js` | Register `PATCH /my/:id/cancel` and `GET /my/order/:orderId/eligibility` before the admin gate | **Modify** |
| `backend/modules/returns/utils/returnEmailHelper.js` | Add `CANCELLED` + `PICKUP_FAILED` templates; guard `refundAmount` against undefined (H9) | **Modify** |
| `backend/modules/returns/utils/returnValidation.js` | Export a reusable `getReturnEligibility(order)` returning `{ isEligible, returnableUntil, reason, daysRemaining }` for the endpoint (C1/RC5) | **Modify** |

**Reused from Plan 1:** `validateTransition`/`getNextStatuses` (`returnStateMachine.js`), `validateOrderEligibility`/`validateReturnWindow` (`returnValidation.js`), the `ReturnRequest` model.

**Email templates:** new HTML files for the two statuses go in **`backend/templates/`** (confirmed location; siblings include `returnRejectedEmail.html`, `returnInitiatedEmail.html`). `processTemplate(name, data)` (`backend/utils/emailService.js:327`) reads `../templates/${name}` and **injects `partials/_header.html` + `partials/_footer.html` itself** — so a new template should contain ONLY the body markup (mirror the inner content of `returnRejectedEmail.html`, not a full HTML document/header/footer). Do not invent a new templating system.

---

## Task 1: EXCHANGE→REFUND guard (pure) — H4

**Files:**
- Create: `backend/modules/returns/state/transitionGuards.js`
- Test: `backend/modules/returns/state/transitionGuards.test.js`

- [ ] **Step 1: Write the failing test**

Create `backend/modules/returns/state/transitionGuards.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canInitiateRefund } from './transitionGuards.js';

test('canInitiateRefund: RETURN type is always allowed', () => {
  assert.deepEqual(canInitiateRefund({ type: 'RETURN' }, null), { ok: true });
});

test('canInitiateRefund: EXCHANGE with no exchange order is allowed', () => {
  assert.deepEqual(canInitiateRefund({ type: 'EXCHANGE', exchangeOrderId: null }, null), { ok: true });
});

test('canInitiateRefund: EXCHANGE with a live (non-cancelled) exchange order is blocked', () => {
  const ret = { type: 'EXCHANGE', exchangeOrderId: 'x1' };
  const exchangeOrder = { tracking: { isCanceled: false } };
  const result = canInitiateRefund(ret, exchangeOrder);
  assert.equal(result.ok, false);
  assert.match(result.reason, /exchange order/i);
});

test('canInitiateRefund: EXCHANGE whose exchange order is cancelled is allowed', () => {
  const ret = { type: 'EXCHANGE', exchangeOrderId: 'x1' };
  const exchangeOrder = { tracking: { isCanceled: true } };
  assert.deepEqual(canInitiateRefund(ret, exchangeOrder), { ok: true });
});

test('canInitiateRefund: REPLACEMENT with a live exchange order is blocked', () => {
  const ret = { type: 'REPLACEMENT', exchangeOrderId: 'x1' };
  assert.equal(canInitiateRefund(ret, { tracking: {} }).ok, false);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test "backend/modules/returns/state/transitionGuards.test.js"`
Expected: FAIL — `Cannot find module './transitionGuards.js'`.

- [ ] **Step 3: Implement**

Create `backend/modules/returns/state/transitionGuards.js`:

```javascript
/**
 * Pure guards for return status transitions.
 * No DB access — callers fetch any related docs and pass them in.
 */

/**
 * Whether a return may transition to REFUND_INITIATED.
 * Blocks EXCHANGE/REPLACEMENT returns from being cash-refunded while a live
 * (non-cancelled) exchange order exists — otherwise the customer keeps the
 * exchanged goods AND gets a refund (H4).
 * @param {{ type:string, exchangeOrderId?:any }} returnRequest
 * @param {{ tracking?:{ isCanceled?:boolean } }|null} exchangeOrder - the linked exchange order, or null
 * @returns {{ ok:true } | { ok:false, reason:string }}
 */
export const canInitiateRefund = (returnRequest, exchangeOrder) => {
  if (returnRequest.type === 'RETURN') return { ok: true };
  if (!returnRequest.exchangeOrderId) return { ok: true };
  const cancelled = exchangeOrder?.tracking?.isCanceled === true;
  if (cancelled) return { ok: true };
  return {
    ok: false,
    reason:
      'Cannot initiate a cash refund: a live exchange/replacement order exists for this return. Cancel the exchange order first.',
  };
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test "backend/modules/returns/state/transitionGuards.test.js"`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/modules/returns/state/transitionGuards.js backend/modules/returns/state/transitionGuards.test.js
git commit -m "feat(returns): add canInitiateRefund guard to block exchange double-payout (H4)"
```

---

## Task 2: `recomputeOrderReturnFlag` helper — H3

**Files:**
- Create: `backend/modules/returns/utils/orderReturnFlag.js`

- [ ] **Step 1: Write the implementation**

This helper needs the DB, so it is not unit-tested in isolation (covered by the end-to-end checks). Create `backend/modules/returns/utils/orderReturnFlag.js`:

```javascript
import ReturnRequest from '../models/ReturnRequestModel.js';
import Order from '../../../models/OrderModel.js';

/**
 * Derive and persist Order.hasReturns from the live (non-terminal) returns
 * for that order. Call after any create/cancel/reject so the flag reflects
 * reality instead of being stuck true forever (H3).
 * @param {string|import('mongoose').Types.ObjectId} orderId - Order _id
 * @returns {Promise<boolean>} the new hasReturns value
 */
export const recomputeOrderReturnFlag = async (orderId) => {
  const hasActive = await ReturnRequest.exists({
    order: orderId,
    status: { $nin: ['REJECTED', 'CANCELLED'] },
  });
  await Order.updateOne({ _id: orderId }, { $set: { hasReturns: Boolean(hasActive) } });
  return Boolean(hasActive);
};

export default { recomputeOrderReturnFlag };
```

- [ ] **Step 2: Syntax + import-resolution check**

Run: `node --check backend/modules/returns/utils/orderReturnFlag.js`
Expected: no output.
Run: `node --input-type=module -e "await import('./backend/modules/returns/utils/orderReturnFlag.js'); console.log('import OK');"`
Expected: prints `import OK` (resolves the model import chain; no DB connection needed to import).

- [ ] **Step 3: Commit**

```bash
git add backend/modules/returns/utils/orderReturnFlag.js
git commit -m "feat(returns): recomputeOrderReturnFlag derives Order.hasReturns (H3)"
```

---

## Task 3: Wire the H4 guard + M2 timestamp into `updateReturnStatus`

**Files:**
- Modify: `backend/modules/returns/controllers/returnController.js`

- [ ] **Step 1: Add imports**

Near the other return-util imports (top of file), add:

```javascript
import { canInitiateRefund } from '../state/transitionGuards.js';
import { recomputeOrderReturnFlag } from '../utils/orderReturnFlag.js';
```

- [ ] **Step 2: Enforce the H4 guard in the REFUND_INITIATED case**

In `updateReturnStatus`, the `case 'REFUND_INITIATED': {` block currently begins (after Plan 1) with:

```javascript
      // Effective refund (items only) via returnPricing: NOT_RECEIVED & UNSELLABLE
      // contribute 0; DAMAGED & GOOD get full refund. Shipping is added to the
      // order ledger separately below.
      const { itemsRefund } = computeReturnRefund(returnRequest);
```

Insert the guard immediately BEFORE that `computeReturnRefund` line (so it runs before any refund math), i.e. right after the `case 'REFUND_INITIATED': {` line:

```javascript
      // H4: block cash refund when a live exchange/replacement order exists.
      if (returnRequest.exchangeOrderId) {
        const linkedExchange = await Order.findById(returnRequest.exchangeOrderId);
        const guard = canInitiateRefund(returnRequest, linkedExchange);
        if (!guard.ok) {
          res.status(400);
          throw new Error(guard.reason);
        }
      } else {
        const guard = canInitiateRefund(returnRequest, null);
        if (!guard.ok) {
          res.status(400);
          throw new Error(guard.reason);
        }
      }
```

- [ ] **Step 3: Set `refundInitiatedAt` (M2) in the same case**

Still in the `REFUND_INITIATED` case, immediately AFTER the existing line `returnRequest.refundAmount = Number(itemsRefund.toFixed(2));`, add:

```javascript
      returnRequest.refundInitiatedAt = new Date();
```

- [ ] **Step 4: Verify**

Run: `node --check backend/modules/returns/controllers/returnController.js`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add backend/modules/returns/controllers/returnController.js
git commit -m "fix(returns): enforce H4 refund guard + set refundInitiatedAt in REFUND_INITIATED (M2)"
```

---

## Task 4: Fix `refundProcessedAt` semantics (M2) + recompute flag on cancel/reject

**Files:**
- Modify: `backend/modules/returns/controllers/returnController.js`

- [ ] **Step 1: Stop COMPLETED from owning `refundProcessedAt`**

The current `COMPLETED` case is:

```javascript
    case 'COMPLETED':
      if (returnRequest.type === 'RETURN') {
        returnRequest.refundProcessedAt = new Date();
      }
      break;
```

Replace it with (COMPLETED no longer sets the processed timestamp — `processRefund` owns it; see Step 2):

```javascript
    case 'COMPLETED':
      break;
```

- [ ] **Step 2: Set `refundProcessedAt` in `processRefund`**

In the `processRefund` handler, the body currently sets method/txn/bank fields then pushes a timeline entry. Immediately after the existing block:

```javascript
  if (refundMethod) returnRequest.refundMethod = refundMethod;
  if (refundTransactionId)
    returnRequest.refundTransactionId = refundTransactionId;
  if (refundBankDetails) returnRequest.refundBankDetails = refundBankDetails;
  if (refundUpiId) returnRequest.refundUpiId = refundUpiId;
  if (priceDifferenceCollected !== undefined)
    returnRequest.priceDifferenceCollected = priceDifferenceCollected;
```

add:

```javascript
  // M2: the refund is actually processed when the admin records it here.
  returnRequest.refundProcessedAt = new Date();
```

- [ ] **Step 3: Recompute `hasReturns` when a status change ends in REJECTED/CANCELLED (H3)**

In `updateReturnStatus`, the code after the switch persists then emails:

```javascript
  await returnRequest.save();

  // Send email (non-blocking)
  sendReturnEmail(returnRequest, status).catch((err) => {
    console.error(`Return ${status} email failed (non-blocking):`, err.message);
  });
```

Insert BETWEEN `await returnRequest.save();` and the `// Send email` comment:

```javascript
  // H3: a return ending in a terminal-negative state frees the order to be returned again.
  if (status === 'REJECTED' || status === 'CANCELLED') {
    await recomputeOrderReturnFlag(returnRequest.order);
  }
```

- [ ] **Step 4: Verify**

Run: `node --check backend/modules/returns/controllers/returnController.js`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add backend/modules/returns/controllers/returnController.js
git commit -m "fix(returns): refundProcessedAt set on record-refund; recompute hasReturns on reject/cancel (M2,H3)"
```

---

## Task 5: Add `getReturnEligibility` to validation (C1/RC5)

**Files:**
- Modify: `backend/modules/returns/utils/returnValidation.js`

- [ ] **Step 1: Add the exported function**

`returnValidation.js` already has `RETURN_WINDOW_DAYS` and `validateReturnWindow`. Add a non-throwing eligibility summary (mirrors the customer client's `useReturnEligibility` rules so client + server agree). Append near `validateReturnWindow`:

```javascript
/**
 * Non-throwing eligibility summary for an order, for the customer eligibility
 * endpoint. Mirrors the client useReturnEligibility rules so both agree (C1).
 * @param {Object} order
 * @returns {{ isEligible:boolean, returnableUntil:Date|null, reason:string|null, daysRemaining:number }}
 */
export const getReturnEligibility = (order) => {
  if (!order) return { isEligible: false, returnableUntil: null, reason: 'not_found', daysRemaining: 0 };
  if (order.tracking?.isCanceled)
    return { isEligible: false, returnableUntil: null, reason: 'order_cancelled', daysRemaining: 0 };
  if (!order.tracking?.isDelivered || !order.tracking?.deliveredAt)
    return { isEligible: false, returnableUntil: null, reason: 'not_delivered', daysRemaining: 0 };

  const deliveredAt = new Date(order.tracking.deliveredAt);
  const returnableUntil = new Date(deliveredAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((returnableUntil.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

  if (now > returnableUntil)
    return { isEligible: false, returnableUntil, reason: 'window_closed', daysRemaining: 0 };

  if (order.hasReturns)
    return { isEligible: false, returnableUntil, reason: 'already_returned', daysRemaining };

  return { isEligible: true, returnableUntil, reason: null, daysRemaining };
};
```

- [ ] **Step 2: Verify syntax**

Run: `node --check backend/modules/returns/utils/returnValidation.js`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add backend/modules/returns/utils/returnValidation.js
git commit -m "feat(returns): add getReturnEligibility summary for customer endpoint (C1)"
```

---

## Task 6: Customer cancel + eligibility controller handlers (H2, C1)

**Files:**
- Modify: `backend/modules/returns/controllers/returnController.js`

- [ ] **Step 1: Confirm the email-template directory (for Task 8)**

Templates live in **`backend/templates/`** (e.g. `returnRejectedEmail.html`), and `processTemplate` injects `backend/templates/partials/_header.html` + `_footer.html`. Quick confirm: `ls backend/templates | grep -i return` — expect the existing return templates. Task 8 adds the two new ones here.

- [ ] **Step 2: Add the two customer handlers**

Append two handlers near the other `My`-prefixed customer handlers (after `getMyReturnById`). They use the imports already present plus those added in Task 3.

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// @desc    Customer: cancel their own return (only while cancellable)
// @route   PATCH /api/returns/my/:id/cancel
// @access  Protected (customer)
// ─────────────────────────────────────────────────────────────────────────────
export const cancelMyReturnRequest = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id);
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }
  if (returnRequest.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorised');
  }

  // State machine decides if CANCELLED is legal from the current status.
  validateTransition(returnRequest.status, 'CANCELLED', returnRequest.type);

  const previousStatus = returnRequest.status;
  returnRequest.status = 'CANCELLED';
  returnRequest.timeline.push({
    action: 'STATUS_CHANGE',
    fromStatus: previousStatus,
    toStatus: 'CANCELLED',
    note: 'Cancelled by customer',
    performedBy: req.user._id,
    performedByName: req.user.name,
  });
  await returnRequest.save();

  // H3: free the order to be returned again.
  await recomputeOrderReturnFlag(returnRequest.order);

  sendReturnEmail(returnRequest, 'CANCELLED').catch((err) => {
    console.error('Return CANCELLED email failed (non-blocking):', err.message);
  });

  res.json(returnRequest);
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Customer: eligibility summary for returning one of their orders
// @route   GET /api/returns/my/order/:orderId/eligibility
// @access  Protected (customer)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyReturnEligibility = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).select(
    'user tracking hasReturns'
  );
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorised');
  }
  res.json(getReturnEligibility(order));
});
```

- [ ] **Step 3: Add the `getReturnEligibility` import**

Extend the existing import from `../utils/returnValidation.js` (which already imports `validateOrderEligibility`, `validateReturnWindow`, `checkOverReturn`, `validateQCCompleteness`, `validateRefundTotal`, `shouldRefundShipping`) to also include `getReturnEligibility`.

- [ ] **Step 4: Verify**

Run: `node --check backend/modules/returns/controllers/returnController.js`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add backend/modules/returns/controllers/returnController.js
git commit -m "feat(returns): customer cancel + eligibility handlers (H2,C1)"
```

---

## Task 7: Register the customer routes (H2, C1)

**Files:**
- Modify: `backend/modules/returns/routes/returnRoutes.js`

- [ ] **Step 1: Import the two new handlers**

In the import list at the top of `returnRoutes.js`, add `cancelMyReturnRequest` and `getMyReturnEligibility` to the destructured import from `../controllers/returnController.js`.

- [ ] **Step 2: Register the routes BEFORE the admin gate**

The current customer block is exactly:

```javascript
// Customer-facing routes (protect only, no admin required)
router.route('/my').post(protect, createMyReturnRequest);
router.route('/my/order/:orderId').get(protect, getMyReturnsByOrder);
router.route('/my/:id').get(protect, getMyReturnById);

// All routes below require admin auth
router.use(protect, isAdmin);
```

Replace it with (new routes added; they MUST stay above `router.use(protect, isAdmin)` so they are customer-accessible — note `/my/order/:orderId/eligibility` is registered before the shorter `/my/order/:orderId` to avoid any ambiguity, and `/my/:id/cancel` is distinct from `/my/:id`):

```javascript
// Customer-facing routes (protect only, no admin required)
router.route('/my').post(protect, createMyReturnRequest);
router.route('/my/order/:orderId/eligibility').get(protect, getMyReturnEligibility);
router.route('/my/order/:orderId').get(protect, getMyReturnsByOrder);
router.route('/my/:id/cancel').patch(protect, cancelMyReturnRequest);
router.route('/my/:id').get(protect, getMyReturnById);

// All routes below require admin auth
router.use(protect, isAdmin);
```

- [ ] **Step 3: Verify**

Run: `node --check backend/modules/returns/routes/returnRoutes.js`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add backend/modules/returns/routes/returnRoutes.js
git commit -m "feat(returns): register customer cancel + eligibility routes (H2,C1)"
```

---

## Task 8: Complete lifecycle emails — H7, H9

**Files:**
- Modify: `backend/modules/returns/utils/returnEmailHelper.js`
- Create: two HTML templates in the templates dir found in Task 6 Step 1

- [ ] **Step 1: Create the two templates**

In **`backend/templates/`**, create `returnCancelledEmail.html` and `returnPickupFailedEmail.html`. First open `backend/templates/returnRejectedEmail.html` and copy its BODY markup only — `processTemplate` (`backend/utils/emailService.js:327-338`) prepends `partials/_header.html` and appends `partials/_footer.html` automatically, so do NOT include `<html>`/`<head>`/header/footer. Reuse the same placeholders `buildEmailData` provides (`{{returnId}}`, `{{orderId}}`, `{{customerName}}`, `{{itemsHtml}}`, `{{supportEmail}}`, `{{supportPhone}}`, etc.).

`returnCancelledEmail.html` body message: the return `{{returnId}}` for order `{{orderId}}` has been cancelled; if unexpected, contact support.
`returnPickupFailedEmail.html` body message: the pickup for return `{{returnId}}` could not be completed; the courier will reattempt / contact support.

- [ ] **Step 2: Register them in `TEMPLATE_MAP`**

The current `TEMPLATE_MAP` (`returnEmailHelper.js`) ends with the `REJECTED` entry:

```javascript
  REJECTED: {
    template: 'returnRejectedEmail.html',
    subject: (r) => `Return Request #${r.returnId} Update`,
  },
};
```

Replace that closing entry with (add the two new entries before the closing brace):

```javascript
  REJECTED: {
    template: 'returnRejectedEmail.html',
    subject: (r) => `Return Request #${r.returnId} Update`,
  },
  CANCELLED: {
    template: 'returnCancelledEmail.html',
    subject: (r) => `Return Request #${r.returnId} Cancelled`,
  },
  PICKUP_FAILED: {
    template: 'returnPickupFailedEmail.html',
    subject: (r) => `Pickup Attempt Failed - #${r.returnId}`,
  },
};
```

- [ ] **Step 3: Guard `refundAmount` against undefined (H9)**

In `buildEmailData`, the current `totalRefund` line is:

```javascript
    totalRefund: formatPrice(
      returnRequest.refundAmount + (returnRequest.shippingRefundAmount || 0)
    ),
```

Replace it with:

```javascript
    totalRefund: formatPrice(
      (returnRequest.refundAmount || 0) + (returnRequest.shippingRefundAmount || 0)
    ),
```

- [ ] **Step 4: Verify**

Run: `node --check backend/modules/returns/utils/returnEmailHelper.js`
Expected: no output.
Run: `node --input-type=module -e "const m = await import('./backend/modules/returns/utils/returnEmailHelper.js'); console.log('import OK');"`
Expected: prints `import OK`.

- [ ] **Step 5: Commit**

```bash
git add backend/modules/returns/utils/returnEmailHelper.js backend/templates/returnCancelledEmail.html backend/templates/returnPickupFailedEmail.html
git commit -m "feat(returns): add CANCELLED + PICKUP_FAILED emails; guard refund total (H7,H9)"
```

---

## Verification (whole plan)

- [ ] Full unit suite still green: `npm test` → expect 18 (Plan 1) + 5 (guard) = **23 passing**.
- [ ] Syntax-check every modified server file:
  `node --check backend/modules/returns/controllers/returnController.js && node --check backend/modules/returns/routes/returnRoutes.js && node --check backend/modules/returns/utils/returnValidation.js && node --check backend/modules/returns/utils/returnEmailHelper.js && node --check backend/modules/returns/utils/orderReturnFlag.js && node --check backend/modules/returns/state/transitionGuards.js`
  Expected: no output.
- [ ] Import-resolution smoke: `node --input-type=module -e "await import('./backend/modules/returns/utils/orderReturnFlag.js'); await import('./backend/modules/returns/utils/returnEmailHelper.js'); await import('./backend/modules/returns/utils/returnValidation.js'); console.log('OK');"` → prints `OK`.
- [ ] Boot smoke: `node --check backend/server.js` → no output.

**End-to-end (manual, needs a running DB):**
- [ ] EXCHANGE return: create exchange order, then `PATCH /:id/status {status:'REFUND_INITIATED'}` → **400** with the H4 message. Cancel the exchange order, retry → succeeds.
- [ ] Customer cancel: as the owning customer, `PATCH /api/returns/my/:id/cancel` on an `INITIATED` return → 200, status `CANCELLED`; the order's `hasReturns` becomes false (if no other live returns); a non-owner → 403; a return already `RECEIVED` → 400 (illegal transition).
- [ ] Eligibility: `GET /api/returns/my/order/:orderId/eligibility` returns the summary; after the cancel above, `isEligible` flips back to true (was `already_returned`).
- [ ] M2: `PATCH /:id/refund` sets `refundProcessedAt`; the `REFUND_INITIATED` transition sets `refundInitiatedAt`; `COMPLETED` no longer overwrites `refundProcessedAt`.
- [ ] Emails: cancelling a return and marking a pickup failed each send a customer email (check logs / inbox).

## Spec coverage (self-review)

| Spec item | Task |
|---|---|
| H4 exchange double-pay guard | 1, 3 |
| H3 derive hasReturns | 2, 4, 6 |
| M2 split refund timestamps | 3, 4 |
| H2 customer cancel | 6, 7 |
| C1/RC5 backend eligibility endpoint | 5, 6, 7 |
| H7 missing emails (CANCELLED, PICKUP_FAILED) | 8 |
| H9 email NaN guard | 8 |

**Deferred to later plans:** client wizard consuming the eligibility endpoint + cancel button + evidence enforcement C2 (Plan 3); admin A1/A2 (Plan 4); full side-effect extraction (RC2 — intentionally out of scope per the decision to keep the switch); M-2 ledger idempotency from Plan 1 review (track separately).
