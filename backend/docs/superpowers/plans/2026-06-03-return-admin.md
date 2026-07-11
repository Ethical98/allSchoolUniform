# Return Admin (Dashboard) Implementation Plan (Plan 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the admin-side return polish — stop offering a cash-refund action that the backend now rejects for live exchanges (A1), make QC disposition badges visually distinct and consistent (A2), and use the canonical refund-method value instead of a brittle remap (A3).

**Architecture:** Three small, independent edits in `frontend/src/Screens/ReturnDetailScreen.js` (CRA + React-Bootstrap + Redux). No new components, no API changes, no Redux changes. A1 hides a button; A2 introduces a tiny local color map used by both QC badge renderings; A3 changes a default + a `<option>` value and drops the inline string remap. This is Plan 4 of 4 (final); the backend H4 guard from Plan 2 already blocks the double-pay server-side — A1 is the matching UI so admins don't see an action that 400s. Spec: `backend/docs/superpowers/specs/2026-06-02-return-module-redesign.md` (findings A1, A2, A3).

**Tech Stack:** Create React App, React, react-bootstrap (`Badge`, `Button`, `Form`), Redux. The admin lives in the same repo as the backend (`/Users/devansh/Desktop/asu`) under `frontend/`. Verification: `npm run build --prefix frontend` (CRA production build = compile + lint).

---

## Reconciliation note
The prior plan `docs/superpowers/plans/2026-05-23-return-exchange-bugfix.md` touched `ReturnDetailScreen.js` (refund modal, PICKUP_FAILED button, QC tab) and that work is already committed. Plan 4's three edits are distinct from those. The line numbers below were read from the current committed file; if a quoted block does not match, STOP and report.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `frontend/src/Screens/ReturnDetailScreen.js` | Hide Initiate-Refund for live exchanges (A1); shared QC badge colors (A2); canonical refund method (A3) | **Modify** |

---

## Task 1: Hide "Initiate Refund" for EXCHANGE/REPLACEMENT with a live exchange order (A1)

**Bug:** At `QC_COMPLETED`, an EXCHANGE/REPLACEMENT has `REFUND_INITIATED` in `nextStatuses`, so the green "Initiate Refund" button shows even after a `Create Exchange Order` has shipped goods. Clicking it now 400s (backend H4 guard), but the button shouldn't be offered.

**Files:**
- Modify: `frontend/src/Screens/ReturnDetailScreen.js`

- [ ] **Step 1: Add the exchange-order guard to the button condition**

The current block (around lines 264-273) is exactly:

```javascript
                {nextStatuses.includes('REFUND_INITIATED') && (
                    <Button
                        variant="success"
                        className="mr-2 mb-1"
                        onClick={() => handleStatusUpdate('REFUND_INITIATED')}
                        disabled={statusLoading}
                    >
                        Initiate Refund
                    </Button>
                )}
```

Replace the opening condition line so the button is hidden when a live exchange order exists for an EXCHANGE/REPLACEMENT:

```javascript
                {nextStatuses.includes('REFUND_INITIATED') &&
                 !(['EXCHANGE', 'REPLACEMENT'].includes(ret.type) && ret.exchangeOrderId) && (
                    <Button
                        variant="success"
                        className="mr-2 mb-1"
                        onClick={() => handleStatusUpdate('REFUND_INITIATED')}
                        disabled={statusLoading}
                    >
                        Initiate Refund
                    </Button>
                )}
```

(For a `RETURN`, `ret.type` is never EXCHANGE/REPLACEMENT, so the button shows as before. For an EXCHANGE/REPLACEMENT with no exchange order yet, `ret.exchangeOrderId` is falsy, so REFUND_INITIATED is still offered — that's the legitimate "exchange not possible → refund instead" path. Only once an exchange order exists is the cash-refund action hidden.)

- [ ] **Step 2: Verify**

Run: `npm run build --prefix frontend` — Expected: compiles successfully (CRA treats lint warnings as warnings in build unless CI=true; ensure no new errors). If the repo sets `CI=true`, a new eslint *warning* fails the build — in that case fix any introduced warning.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/Screens/ReturnDetailScreen.js
git commit -m "fix(admin/returns): hide Initiate Refund for live exchange/replacement orders (A1)"
```

---

## Task 2: Distinct, consistent QC disposition badge colors (A2)

**Bug:** The overview Items table (≈lines 465-470) colors only GOOD (success) and DAMAGED (danger); UNSELLABLE and NOT_RECEIVED both fall through to `warning` — indistinguishable. Separately, the read-only QC Results table (≈lines 546-549) colors DAMAGED as `warning` (not `danger`) — the two tables disagree. Introduce one color map and use it in both.

**Files:**
- Modify: `frontend/src/Screens/ReturnDetailScreen.js`

- [ ] **Step 1: Add a module-level color map**

Near the top of the file, after the imports and before the component definition (the component is `const ReturnDetailScreen = ({ match, history }) => {`), add:

```javascript
// QC disposition → react-bootstrap Badge variant (shared by both QC tables).
const QC_BADGE_VARIANT = {
    GOOD: 'success',
    DAMAGED: 'danger',
    UNSELLABLE: 'dark',
    NOT_RECEIVED: 'secondary',
};
```

- [ ] **Step 2: Use it in the overview Items table**

Replace the overview badge block (the `<Badge bg={ ... }>` with the GOOD/DAMAGED/warning ternary, around lines 464-474):

```javascript
                                                            <Badge
                                                                bg={
                                                                    item.qcDisposition === 'GOOD'
                                                                        ? 'success'
                                                                        : item.qcDisposition === 'DAMAGED'
                                                                        ? 'danger'
                                                                        : 'warning'
                                                                }
                                                            >
                                                                {item.qcDisposition}
                                                            </Badge>
```

with:

```javascript
                                                            <Badge bg={QC_BADGE_VARIANT[item.qcDisposition] || 'warning'}>
                                                                {item.qcDisposition}
                                                            </Badge>
```

- [ ] **Step 3: Use it in the read-only QC Results table**

Find the QC Results table badge (around lines 545-552). The current block is exactly:

```javascript
                                                                <Badge bg={
                                                                    item.qcDisposition === 'GOOD' ? 'success' :
                                                                    item.qcDisposition === 'DAMAGED' ? 'warning' :
                                                                    item.qcDisposition === 'UNSELLABLE' ? 'danger' :
                                                                    item.qcDisposition === 'NOT_RECEIVED' ? 'secondary' : 'light'
                                                                }>
                                                                    {item.qcDisposition || 'PENDING'}
                                                                </Badge>
```

Replace it with (preserves the `|| 'PENDING'` fallback label; now DAMAGED is `danger` consistently with the overview table, and the `|| 'warning'` covers the PENDING/undefined case the old `'light'` fallback handled):

```javascript
                                                                <Badge bg={QC_BADGE_VARIANT[item.qcDisposition] || 'warning'}>
                                                                    {item.qcDisposition || 'PENDING'}
                                                                </Badge>
```

If the quoted block does not match exactly, STOP and report rather than guessing.

- [ ] **Step 4: Verify**

Run: `npm run build --prefix frontend` — Expected: compiles successfully, no new errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/Screens/ReturnDetailScreen.js
git commit -m "fix(admin/returns): distinct, consistent QC disposition badge colors (A2)"
```

---

## Task 3: Use the canonical refund-method value (A3)

**Bug:** The refund-method `<select>` uses option value `ORIGINAL` and a default `useState('ORIGINAL')`, then remaps `ORIGINAL → ORIGINAL_PAYMENT` inline in `handleRefundSubmit`. The backend enum is `ORIGINAL_PAYMENT`. Use the canonical value directly and drop the remap.

**Files:**
- Modify: `frontend/src/Screens/ReturnDetailScreen.js`

- [ ] **Step 1: Default the state to the canonical value**

The current state line (≈line 43) is:

```javascript
    const [refundMethod, setRefundMethod] = useState('ORIGINAL');
```

Replace with:

```javascript
    const [refundMethod, setRefundMethod] = useState('ORIGINAL_PAYMENT');
```

- [ ] **Step 2: Drop the inline remap in `handleRefundSubmit`**

The current dispatch (≈lines 173-178) is:

```javascript
        dispatch(
            processRefund(returnId, {
                refundMethod: refundMethod === 'ORIGINAL' ? 'ORIGINAL_PAYMENT' : refundMethod,
                refundTransactionId: refundReference || undefined,
            })
        );
```

Replace with:

```javascript
        dispatch(
            processRefund(returnId, {
                refundMethod,
                refundTransactionId: refundReference || undefined,
            })
        );
```

- [ ] **Step 3: Fix the `<option>` value**

The current option (≈line 713) is:

```javascript
                                    <option value="ORIGINAL">Original Payment Method</option>
```

Replace with:

```javascript
                                    <option value="ORIGINAL_PAYMENT">Original Payment Method</option>
```

(The other options — `BANK_TRANSFER`, `STORE_CREDIT`, `UPI` — already match the backend enum and stay unchanged.)

- [ ] **Step 4: Verify**

Run: `npm run build --prefix frontend` — Expected: compiles successfully, no new errors.
Also grep to confirm no stray `'ORIGINAL'` literal remains: `grep -n "'ORIGINAL'" frontend/src/Screens/ReturnDetailScreen.js` → Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/Screens/ReturnDetailScreen.js
git commit -m "fix(admin/returns): use canonical ORIGINAL_PAYMENT refund method value (A3)"
```

---

## Verification (whole plan)

- [ ] CRA build clean: `npm run build --prefix frontend` → "Compiled successfully" (or only pre-existing warnings).
- [ ] `grep -n "'ORIGINAL'" frontend/src/Screens/ReturnDetailScreen.js` → no matches (A3 remap fully gone).
- [ ] `grep -n "QC_BADGE_VARIANT" frontend/src/Screens/ReturnDetailScreen.js` → three references (definition + two tables).

**Manual (admin UI against a backend running Plans 1–2):**
- [ ] **A1:** Open an EXCHANGE return at `QC_COMPLETED` that already has an exchange order created → the "Initiate Refund" button is absent; "Create Exchange Order" is also absent (already created). An EXCHANGE with no exchange order yet still shows "Initiate Refund" (refund-instead path). A plain RETURN still shows it.
- [ ] **A2:** A return whose items have mixed dispositions shows four visually distinct badges (GOOD green, DAMAGED red, UNSELLABLE dark, NOT_RECEIVED grey) in both the overview and QC Results tables, with DAMAGED the same color in both.
- [ ] **A3:** Open the Record Refund modal → the method defaults to "Original Payment Method"; submitting records `ORIGINAL_PAYMENT` (check the saved return's `refundMethod`).

## Spec coverage (self-review)

| Spec item | Task |
|---|---|
| A1 hide refund-on-exchange button | 1 |
| A2 distinct/consistent QC badge colors | 2 |
| A3 canonical refund-method value | 3 |

**Completes the audit remediation.** All 24 findings across Plans 1–4 are now addressed (criticals + customer-facing in Plans 1–3; admin polish here). The only intentionally-deferred items are the spec's full RC2 side-effect extraction (kept inline by decision) and the Plan-1-review M-2 ledger-idempotency note (tracked separately).
