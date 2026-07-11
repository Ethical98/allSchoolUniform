# Admin Returns UI/UX Rework — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the admin returns module into a "next action" cockpit detail screen and an actionable triage list, so a single admin can run a return end-to-end with the correct next step always obvious and all context on one screen.

**Architecture:** Frontend-only rework of the asu CRA/Redux app. A new `nextActionMap` config turns the backend's `nextStatuses` into a single primary action + a "More" menu. New presentational components (stepper, action bar, triage cards, copy row) are composed by rewritten `ReturnDetailScreen` and `ReturnListScreen`. No backend, API, model, action-creator, or reducer changes.

**Tech Stack:** React 17 (CRA), Redux + redux-thunk, react-bootstrap, material-table, react-router-dom v5.

**Testing note:** The frontend has no test suite or test culture. Per decision, this plan uses **manual verification in the browser** (lifecycle walkthrough), not automated tests. Each task ends with explicit manual verification steps + a commit. Run the app with `npm start` from `frontend/`.

---

## File Structure

New files (all under `frontend/src/`):
- `components/returns/nextActionMap.js` — config: status/type → action display descriptors. The single source of truth for the action bar. **Coupled to** `backend/.../returnStateMachine.js`; comment documents this.
- `components/returns/ReturnStatusStepper.js` — horizontal lifecycle stepper.
- `components/returns/ReturnActionBar.js` — primary action + "More ▾" menu; consumes `nextActionMap`.
- `components/returns/ReturnTriageCards.js` — clickable bucket cards for the list.
- `components/returns/CopyRow.js` — label + value + copy button (extracted from detail screen).
- `components/returns/returns.css` — shared styling for the new components.

Modified:
- `Screens/ReturnDetailScreen.js` — rewritten to the cockpit layout.
- `Screens/ReturnListScreen.js` — triage cards + Age/Next-action columns.

Unchanged / reused: `ReturnStatusBadge.js`, `ReturnTimeline.js`, `QCDispositionForm.js`, all `returnActions.js`, all reducers/constants, `AdminPageLayout.js`, `Paginate.js`.

---

## Task 1: `nextActionMap` config

The presentation layer over the state machine. Given the current status, return type, and the return object, it produces ordered action descriptors used by the action bar. Each descriptor:
`{ key, label, variant, kind: 'primary'|'secondary', targetStatus?, hint?, disabled?, disabledReason? }`.

**Files:**
- Create: `frontend/src/components/returns/nextActionMap.js`

- [ ] **Step 1: Create the config + builder**

```javascript
// frontend/src/components/returns/nextActionMap.js
//
// Presentation layer over the return state machine.
// COUPLED TO: backend/modules/returns/utils/returnStateMachine.js
// If the backend transitions change, update STATUS_ACTIONS below to match.
//
// The backend sends `nextStatuses` (valid transitions for this return). This
// module maps each one — plus a few status-derived pseudo-actions (Record Refund,
// Create Exchange Order) — to how it should render in the action bar.

const fmtAmount = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Static display for each target status. `kind` decides primary vs "More" menu.
const STATUS_ACTIONS = {
  APPROVED: { label: 'Approve', variant: 'success', kind: 'primary' },
  REJECTED: { label: 'Reject', variant: 'danger', kind: 'primary', modal: 'reject' },
  PICKUP_SCHEDULED: { label: 'Schedule Pickup', variant: 'primary', kind: 'primary' },
  PICKUP_FAILED: { label: 'Mark Pickup Failed', variant: 'warning', kind: 'secondary' },
  IN_TRANSIT: { label: 'Mark In Transit', variant: 'info', kind: 'primary' },
  RECEIVED: { label: 'Mark Received', variant: 'info', kind: 'primary' },
  QC_IN_PROGRESS: { label: 'Start QC', variant: 'warning', kind: 'primary' },
  QC_COMPLETED: { label: 'Complete QC', variant: 'primary', kind: 'primary' },
  REFUND_INITIATED: { label: 'Initiate Refund', variant: 'success', kind: 'primary' },
  EXCHANGE_SHIPPED: { label: 'Mark Exchange Shipped', variant: 'success', kind: 'primary' },
  REPLACEMENT_SHIPPED: { label: 'Mark Replacement Shipped', variant: 'success', kind: 'primary' },
  COMPLETED: { label: 'Mark Completed', variant: 'dark', kind: 'primary' },
  CANCELLED: { label: 'Cancel', variant: 'outline-danger', kind: 'secondary' },
};

// Build ordered action descriptors for the action bar.
// ret: the returnRequest object; nextStatuses: string[] from the detail payload.
export const buildReturnActions = (ret, nextStatuses = []) => {
  if (!ret) return [];
  const actions = [];
  const isExchangeLike = ret.type === 'EXCHANGE' || ret.type === 'REPLACEMENT';

  nextStatuses.forEach((status) => {
    const base = STATUS_ACTIONS[status];
    if (!base) return;

    // Exchange/replacement: the "ship" transition needs an exchange order first.
    // Until one exists, surface "Create Exchange Order" instead of "Mark ... Shipped".
    if ((status === 'EXCHANGE_SHIPPED' || status === 'REPLACEMENT_SHIPPED')) {
      if (!ret.exchangeOrderId) {
        actions.push({
          key: 'create-exchange-order',
          label: `Create ${ret.type === 'REPLACEMENT' ? 'Replacement' : 'Exchange'} Order`,
          variant: 'success',
          kind: 'primary',
          action: 'createExchangeOrder',
        });
        return;
      }
    }

    // RETURN refund: block-free; show the amount on the button.
    if (status === 'REFUND_INITIATED' && !(isExchangeLike && ret.exchangeOrderId)) {
      actions.push({
        key: 'refund-initiated',
        label: `Initiate Refund · ${fmtAmount(ret.refundAmount)}`,
        variant: 'success',
        kind: 'primary',
        targetStatus: 'REFUND_INITIATED',
        supportsFullRefundOverride: true,
      });
      return;
    }

    // QC completion is gated: every item must have a disposition.
    if (status === 'QC_COMPLETED') {
      const pending = (ret.items || []).some(
        (it) => !it.qcDisposition || it.qcDisposition === 'PENDING'
      );
      actions.push({
        key: 'qc-completed',
        ...base,
        targetStatus: 'QC_COMPLETED',
        disabled: pending,
        disabledReason: pending ? 'Set a disposition on all items first' : undefined,
      });
      return;
    }

    actions.push({ key: status.toLowerCase(), ...base, targetStatus: status });
  });

  // Status-derived pseudo-action: record an already-initiated RETURN refund as paid.
  if (ret.status === 'REFUND_INITIATED' && ret.type === 'RETURN') {
    actions.push({
      key: 'record-refund',
      label: `Record Refund Paid · ${fmtAmount(ret.refundAmount)}`,
      variant: 'outline-success',
      kind: 'primary',
      modal: 'refund',
    });
  }

  // Sort primaries first (preserving insertion order within each group).
  return actions.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'primary' ? -1 : 1));
};

// Is this a terminal state with no further action?
export const isTerminal = (status) =>
  ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(status);

export default buildReturnActions;
```

- [ ] **Step 2: Verify it parses**

Run: `cd frontend && npx eslint src/components/returns/nextActionMap.js`
Expected: no errors (warnings about unused are acceptable but aim for none).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/returns/nextActionMap.js
git commit -m "feat(returns): nextActionMap config for action bar

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Shared CSS + `CopyRow`

**Files:**
- Create: `frontend/src/components/returns/returns.css`
- Create: `frontend/src/components/returns/CopyRow.js`

- [ ] **Step 1: Create shared CSS**

```css
/* frontend/src/components/returns/returns.css */

/* Stepper */
.ret-stepper { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin: 8px 0 4px; }
.ret-step { font-size: 0.72rem; padding: 3px 10px; border-radius: 14px; background: #e2e3ea; color: #888; white-space: nowrap; }
.ret-step--done { background: #cfe9d2; color: #256b2a; }
.ret-step--now { background: #1f6feb; color: #fff; font-weight: 600; }
.ret-step--terminal { background: #f8d7da; color: #842029; font-weight: 600; }
.ret-step-sep { color: #c4c4cc; font-size: 0.7rem; }

/* Action bar */
.ret-actionbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
  padding: 12px 14px; background: #fff7e6; border: 1px solid #f0e2c0; border-radius: 8px;
  position: sticky; top: 0; z-index: 5; margin-bottom: 16px; }
.ret-actionbar--terminal { background: #eef7ef; border-color: #cfe9d2; }
.ret-actionbar__next { font-weight: 700; color: #7a5b00; }
.ret-actionbar__hint { font-size: 0.8rem; color: #a06000; }
.ret-actionbar__more { margin-left: auto; }

/* Triage bucket cards */
.ret-bucket { cursor: pointer; border: 1px solid #e6e7ee; border-radius: 8px;
  padding: 10px 12px; text-align: center; transition: border-color .12s, background .12s; }
.ret-bucket:hover { border-color: #1f6feb; }
.ret-bucket--active { border-color: #1f6feb; background: #eef4ff; }
.ret-bucket__n { font-size: 1.5rem; font-weight: 800; line-height: 1; }
.ret-bucket__t { font-size: 0.72rem; color: #888; text-transform: uppercase; letter-spacing: .03em; margin-top: 4px; }

/* List age + next-action */
.ret-age-stale { color: #c62828; font-weight: 600; }
.ret-next-link { color: #1f6feb; font-weight: 600; }
```

- [ ] **Step 2: Create `CopyRow`**

```javascript
// frontend/src/components/returns/CopyRow.js
import React from 'react';
import { Button } from 'react-bootstrap';

const copy = (value) => {
  if (value && navigator.clipboard) {
    navigator.clipboard.writeText(String(value)).catch(() => {});
  }
};

// One labelled value with a copy button (UPI IDs, account numbers, Razorpay refs).
const CopyRow = ({ label, value }) => (
  <p className="mb-1">
    <strong>{label}:</strong> {value}{' '}
    <Button
      variant="link"
      size="sm"
      className="p-0 align-baseline"
      title={`Copy ${label}`}
      onClick={() => copy(value)}
    >
      Copy
    </Button>
  </p>
);

export default CopyRow;
```

- [ ] **Step 3: Verify lint**

Run: `cd frontend && npx eslint src/components/returns/CopyRow.js`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/returns/returns.css frontend/src/components/returns/CopyRow.js
git commit -m "feat(returns): shared returns.css and CopyRow component

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `ReturnStatusStepper`

**Files:**
- Create: `frontend/src/components/returns/ReturnStatusStepper.js`

- [ ] **Step 1: Create the component**

```javascript
// frontend/src/components/returns/ReturnStatusStepper.js
import React from 'react';
import { isTerminal } from './nextActionMap';
import './returns.css';

// Condensed lifecycle for display. Pickup/transit collapse into "Picked up".
const STEPS = [
  { key: 'INITIATED', label: 'Initiated' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'PICKED_UP', label: 'Picked up', match: ['PICKUP_SCHEDULED', 'IN_TRANSIT', 'PICKUP_FAILED'] },
  { key: 'RECEIVED', label: 'Received' },
  { key: 'QC', label: 'QC', match: ['QC_IN_PROGRESS', 'QC_COMPLETED'] },
  { key: 'RESOLVE', label: 'Refund / Exchange', match: ['REFUND_INITIATED', 'EXCHANGE_SHIPPED', 'REPLACEMENT_SHIPPED'] },
  { key: 'COMPLETED', label: 'Done' },
];

const orderOf = (status) => {
  for (let i = 0; i < STEPS.length; i += 1) {
    const s = STEPS[i];
    if (s.key === status || (s.match && s.match.includes(status))) return i;
  }
  return -1;
};

const ReturnStatusStepper = ({ status }) => {
  if (isTerminal(status) && status !== 'COMPLETED') {
    return (
      <div className="ret-stepper">
        <span className="ret-step ret-step--terminal">
          {status === 'REJECTED' ? 'Rejected' : 'Cancelled'}
        </span>
      </div>
    );
  }

  const current = status === 'COMPLETED' ? STEPS.length - 1 : orderOf(status);

  return (
    <div className="ret-stepper">
      {STEPS.map((step, i) => (
        <React.Fragment key={step.key}>
          {i > 0 && <span className="ret-step-sep">›</span>}
          <span
            className={
              'ret-step' +
              (i < current ? ' ret-step--done' : i === current ? ' ret-step--now' : '')
            }
          >
            {step.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

export default ReturnStatusStepper;
```

- [ ] **Step 2: Verify lint**

Run: `cd frontend && npx eslint src/components/returns/ReturnStatusStepper.js`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/returns/ReturnStatusStepper.js
git commit -m "feat(returns): ReturnStatusStepper lifecycle component

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: `ReturnActionBar`

Renders the primary action(s) inline and secondary actions in a "More ▾" dropdown.
It is presentational: it calls back to the parent for every action via props, so the
detail screen keeps owning dispatch/modal state.

**Files:**
- Create: `frontend/src/components/returns/ReturnActionBar.js`

- [ ] **Step 1: Create the component**

```javascript
// frontend/src/components/returns/ReturnActionBar.js
import React from 'react';
import { Button, Dropdown, Form } from 'react-bootstrap';
import buildReturnActions, { isTerminal } from './nextActionMap';
import './returns.css';

// Props:
//   ret, nextStatuses           — data
//   busy                        — disable all while a request is in flight
//   fullRefundOverride, onToggleFullRefundOverride
//   onStatusUpdate(targetStatus, extra)   — dispatch a status transition
//   onAction(actionKey)         — non-status actions: 'createExchangeOrder'
//   onOpenModal(modalKey)       — 'reject' | 'refund' | 'note'
const ReturnActionBar = ({
  ret,
  nextStatuses = [],
  busy = false,
  fullRefundOverride = false,
  onToggleFullRefundOverride,
  onStatusUpdate,
  onAction,
  onOpenModal,
}) => {
  if (!ret) return null;

  const actions = buildReturnActions(ret, nextStatuses);
  const primaries = actions.filter((a) => a.kind === 'primary');
  const secondaries = actions.filter((a) => a.kind === 'secondary');

  const run = (a) => {
    if (a.modal) return onOpenModal(a.modal);
    if (a.action) return onAction(a.action);
    if (a.targetStatus) {
      const extra = a.supportsFullRefundOverride ? { fullRefundOverride } : {};
      return onStatusUpdate(a.targetStatus, extra);
    }
  };

  if (isTerminal(ret.status)) {
    return (
      <div className="ret-actionbar ret-actionbar--terminal">
        <span style={{ color: '#256b2a', fontWeight: 600 }}>
          {ret.status === 'COMPLETED'
            ? '✓ Return complete — no further action.'
            : ret.status === 'REJECTED'
            ? 'This return was rejected.'
            : 'This return was cancelled.'}
        </span>
        <Button
          variant="outline-secondary"
          size="sm"
          className="ret-actionbar__more"
          onClick={() => onOpenModal('note')}
        >
          <i className="fas fa-sticky-note" /> Add Note
        </Button>
      </div>
    );
  }

  // First primary may carry a hint (disabledReason or its own hint).
  const leadHint = primaries.find((a) => a.disabledReason || a.hint);

  return (
    <div className="ret-actionbar">
      <span className="ret-actionbar__next">Next:</span>

      {primaries.map((a) => (
        <React.Fragment key={a.key}>
          {a.supportsFullRefundOverride && (
            <Form.Check
              type="checkbox"
              id="full-refund-override"
              label="Full refund"
              className="mb-0"
              checked={fullRefundOverride}
              onChange={(e) => onToggleFullRefundOverride(e.target.checked)}
            />
          )}
          <Button
            variant={a.variant}
            disabled={busy || a.disabled}
            title={a.disabledReason || a.label}
            onClick={() => run(a)}
          >
            {a.label}
          </Button>
        </React.Fragment>
      ))}

      {leadHint && leadHint.disabledReason && (
        <span className="ret-actionbar__hint">⚠ {leadHint.disabledReason}</span>
      )}

      <Dropdown className="ret-actionbar__more">
        <Dropdown.Toggle variant="outline-secondary" size="sm" id="ret-more">
          More
        </Dropdown.Toggle>
        <Dropdown.Menu align="right">
          {secondaries.map((a) => (
            <Dropdown.Item key={a.key} disabled={busy} onClick={() => run(a)}>
              {a.label}
            </Dropdown.Item>
          ))}
          {secondaries.length > 0 && <Dropdown.Divider />}
          <Dropdown.Item onClick={() => onOpenModal('note')}>Add Note</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default ReturnActionBar;
```

- [ ] **Step 2: Verify lint**

Run: `cd frontend && npx eslint src/components/returns/ReturnActionBar.js`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/returns/ReturnActionBar.js
git commit -m "feat(returns): ReturnActionBar primary + More menu

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Rewrite `ReturnDetailScreen` to the cockpit layout

Wires the new components into a single-page, two-column cockpit. Keeps all existing
Redux selectors, action dispatches, success-reset effects, and the three modals
(Reject / Refund / Note). The action bar replaces `renderActionButtons`; tabs are
removed in favor of stacked cards + a collapsible timeline.

**Files:**
- Modify: `frontend/src/Screens/ReturnDetailScreen.js` (full rewrite of the render tree; keep the hooks/effects/handlers block intact)

- [ ] **Step 1: Replace imports + keep state/effects, swap render**

Keep everything from the top of the file through the `renderRefundDestination` function (imports, all selectors/effects, `handleStatusUpdate`/`handleReject`/`handleQCSubmit`/`handleRefundSubmit`/`handleAddNote`, `copyToClipboard`, and `renderRefundDestination` — the latter is reused by the Financials card). Only `renderActionButtons` and the inline `CopyRow` are removed. Apply these edits:
  1. Remove the `Tabs, Tab` imports from react-bootstrap (line 4) and add `Collapse`.
  2. Remove `import ReturnTimeline` is **kept** (still used).
  3. Add new imports after the existing component imports:

```javascript
import ReturnStatusStepper from '../components/returns/ReturnStatusStepper';
import ReturnActionBar from '../components/returns/ReturnActionBar';
import CopyRow from '../components/returns/CopyRow';
import { createExchangeOrder as createExchangeOrderAction } from '../actions/returnActions';
```

  4. Remove the local `activeTab` state and the inline `CopyRow` definition (now imported). Add:

```javascript
const [showTimeline, setShowTimeline] = useState(false);
```

  5. Replace the `renderActionButtons` function entirely with handler glue:

```javascript
const handleAction = (actionKey) => {
  if (actionKey === 'createExchangeOrder') dispatch(createExchangeOrder(returnId));
};
const handleOpenModal = (modalKey) => {
  if (modalKey === 'reject') return setShowRejectModal(true);
  if (modalKey === 'note') return setShowNoteModal(true);
  if (modalKey === 'refund') {
    setRefundAmount(ret.refundAmount || '');
    if (ret.refundMethod === 'UPI' || ret.refundMethod === 'BANK_TRANSFER') {
      setRefundMethod(ret.refundMethod);
    }
    return setShowRefundModal(true);
  }
};
const anyBusy = statusLoading || exLoading;
```

- [ ] **Step 2: Replace the main render (the `return (...)` after the loading guards) — header + action bar + two-column body + collapsible timeline + the existing three modals**

Replace from `<>` (the success branch, currently `renderActionButtons()` + `<Tabs>`) through the closing of the Tabs, leaving the three `<Modal>` blocks unchanged, with:

```jsx
<>
  <div className="mb-2">
    <ReturnStatusStepper status={ret.status} />
  </div>

  <ReturnActionBar
    ret={ret}
    nextStatuses={nextStatuses}
    busy={anyBusy}
    fullRefundOverride={fullRefundOverride}
    onToggleFullRefundOverride={setFullRefundOverride}
    onStatusUpdate={handleStatusUpdate}
    onAction={handleAction}
    onOpenModal={handleOpenModal}
  />

  <Row>
    {/* LEFT: items/QC + customer reason */}
    <Col lg={7}>
      <Card className="mb-3">
        <Card.Header>Items {ret.status === 'QC_IN_PROGRESS' && '· QC Inspection'}</Card.Header>
        <Card.Body>
          {ret.status === 'QC_IN_PROGRESS' ? (
            <QCDispositionForm items={ret.items || []} onSubmit={handleQCSubmit} />
          ) : (
            <Table bordered hover responsive size="sm">
              <thead>
                <tr>
                  <th>Product</th><th>Size</th><th>Qty</th><th>Price</th>
                  <th>QC</th><th>QC Notes</th>{ret.type === 'EXCHANGE' && <th>Exchange</th>}
                </tr>
              </thead>
              <tbody>
                {(ret.items || []).map((item, i) => (
                  <tr key={i}>
                    <td>{item.productName || item.name || '-'}</td>
                    <td>{item.size || '-'}</td>
                    <td>{item.returnQty}</td>
                    <td>₹{item.price || 0}</td>
                    <td>
                      {item.qcDisposition ? (
                        <Badge bg={QC_BADGE_VARIANT[item.qcDisposition] || 'warning'}>
                          {item.qcDisposition}
                        </Badge>
                      ) : '-'}
                    </td>
                    <td>{item.qcNotes || '-'}</td>
                    {ret.type === 'EXCHANGE' && (
                      <td>{item.exchangeSize ? `Size: ${item.exchangeSize}` : '-'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>Customer Reason</Card.Header>
        <Card.Body>
          <p className="mb-1"><strong>Reason:</strong> {ret.reason?.replace(/_/g, ' ') || '-'}</p>
          {ret.reasonDetails && <p className="mb-1"><strong>Details:</strong> {ret.reasonDetails}</p>}
          {Array.isArray(ret.evidenceImages) && ret.evidenceImages.length > 0 && (
            <div className="d-flex flex-wrap mt-2" style={{ gap: '8px' }}>
              {ret.evidenceImages.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                  <img src={src} alt={`Evidence ${i + 1}`}
                    style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} />
                </a>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>

    {/* RIGHT: financials + shipping + customer */}
    <Col lg={5}>
      <Card className="mb-3">
        <Card.Header>Financials</Card.Header>
        <Card.Body>
          <p className="mb-1"><strong>Refund Amount:</strong> ₹{ret.refundAmount || 0}</p>
          <p className="mb-1"><strong>Refund Method:</strong> {ret.refundMethod?.replace(/_/g, ' ') || '-'}</p>
          <div className="border rounded p-2 my-2 bg-light">
            <p className="mb-1 text-uppercase text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.03em' }}>
              Refund Destination
            </p>
            {renderRefundDestination()}
          </div>
          {ret.refundTransactionId && <p className="mb-1"><strong>Transaction ID:</strong> {ret.refundTransactionId}</p>}
          {ret.refundProcessedAt && <p className="mb-1"><strong>Refund Processed:</strong> {ret.refundProcessedAt.substring(0, 10)}</p>}
          {ret.priceDifference !== 0 && (
            <p className="mb-1">
              <strong>Price Difference:</strong> ₹{Math.abs(ret.priceDifference)}{' '}
              {ret.priceDifference > 0 ? '(customer owes)' : '(refund due)'}
              {ret.priceDifference > 0 && (
                <Badge bg={ret.priceDifferenceCollected ? 'success' : 'warning'} className="ml-2">
                  {ret.priceDifferenceCollected ? 'Collected' : 'Pending'}
                </Badge>
              )}
            </p>
          )}
          {ret.creditNoteNumber && <p className="mb-1"><strong>Credit Note:</strong> {ret.creditNoteNumber}</p>}
          {ret.exchangeOrderNumber && <p className="mb-1"><strong>Exchange Order:</strong> {ret.exchangeOrderNumber}</p>}
          {!ret.creditNote && ret.status !== 'REJECTED' && ret.status !== 'CANCELLED' && (
            <Button variant="outline-primary" size="sm" className="mt-1"
              onClick={() => dispatch(generateCreditNote(returnId))} disabled={cnLoading}>
              Generate Credit Note
            </Button>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>Shipping</Card.Header>
        <Card.Body>
          {ret.reverseShipping?.awbCode || ret.reverseShipping?.providerOrderId ? (
            <>
              <p className="mb-1"><strong>Provider:</strong> {ret.reverseShipping.provider || 'Shiprocket'}</p>
              <p className="mb-1"><strong>AWB:</strong> {ret.reverseShipping.awbCode || '-'}</p>
              <p className="mb-1"><strong>Courier:</strong> {ret.reverseShipping.courierName || '-'}</p>
              <p className="mb-1"><strong>Status:</strong> {ret.reverseShipping.status || '-'}</p>
              {ret.reverseShipping.trackingUrl && (
                <a href={ret.reverseShipping.trackingUrl} target="_blank" rel="noopener noreferrer">Track Shipment</a>
              )}
              {ret.reverseShipping?.providerShipmentId && (
                <div className="mt-2 d-flex" style={{ gap: '8px' }}>
                  <Button variant="outline-warning" size="sm" disabled={initiateLoading}
                    onClick={() => dispatch(initiateReturnPickup(returnId))}>
                    {initiateLoading ? 'Requesting…' : '📦 Initiate Pickup'}
                  </Button>
                  {!ret.reverseShipping?.labelUrl && (
                    <Button variant="outline-primary" size="sm" disabled={labelLoading}
                      onClick={() => dispatch(generateReturnLabel(returnId))}>
                      {labelLoading ? 'Generating…' : 'Generate Label'}
                    </Button>
                  )}
                </div>
              )}
              {ret.reverseShipping?.labelUrl && (
                <p className="mt-2 mb-0">
                  <a href={ret.reverseShipping.labelUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline-success" size="sm">Download Label</Button>
                  </a>
                </p>
              )}
            </>
          ) : (
            <p className="text-muted mb-0">No reverse shipment created yet.</p>
          )}
          {ret.exchangeOrderNumber && ret.exchangeOrderId && (
            <div className="mt-3 pt-2 border-top">
              <p className="mb-1"><strong>Exchange Order:</strong> {ret.exchangeOrderNumber}</p>
              <Button variant="primary" size="sm"
                onClick={() => window.open(`/admin/shipping/orders/${ret.exchangeOrderId}`, '_blank')}>
                Ship This Order →
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>Customer & Order</Card.Header>
        <Card.Body>
          <p className="mb-1"><strong>Customer:</strong> {ret.customerName || '-'}</p>
          <p className="mb-1"><strong>Email:</strong> {ret.customerEmail || '-'}</p>
          <p className="mb-1"><strong>Phone:</strong> {ret.customerPhone || '-'}</p>
          <p className="mb-1"><strong>Order:</strong>{' '}
            <a href={`/admin/order/${ret.order}/edit`} target="_blank" rel="noopener noreferrer">{ret.orderId}</a>
          </p>
          <p className="mb-1"><strong>Created:</strong> {ret.createdAt?.substring(0, 10)} by {ret.createdByName || '-'}</p>
          {ret.pickupAddress && (
            <p className="mb-0 mt-2"><strong>Pickup:</strong> {ret.pickupAddress.address}, {ret.pickupAddress.city}, {ret.pickupAddress.state} - {ret.pickupAddress.postalCode} · {ret.pickupAddress.phone}</p>
          )}
        </Card.Body>
      </Card>
    </Col>
  </Row>

  <Card className="mb-3">
    <Card.Header style={{ cursor: 'pointer' }} onClick={() => setShowTimeline((v) => !v)}>
      Timeline {showTimeline ? '▾' : '▸'}
    </Card.Header>
    <Collapse in={showTimeline}>
      <Card.Body><ReturnTimeline timeline={ret.timeline || []} /></Card.Body>
    </Collapse>
  </Card>

  {/* Reject / Refund / Note modals — UNCHANGED, keep existing blocks here */}
</>
```

  Keep the three existing `<Modal>` blocks (Reject, Refund, Note) exactly as they are, inside this fragment.

- [ ] **Step 3: Run the app and verify the page renders**

Run: `cd frontend && npm start` (leave running)
Open: `http://localhost:3000/admin/returns/<some-id>` (pick a return id from the list)
Expected: stepper at top, one action bar with the correct primary action, two-column cards (items/reason left; financials/shipping/customer right), collapsible timeline at the bottom. No console errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/Screens/ReturnDetailScreen.js
git commit -m "feat(returns): rework detail screen into next-action cockpit

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: `ReturnTriageCards`

**Files:**
- Create: `frontend/src/components/returns/ReturnTriageCards.js`

- [ ] **Step 1: Create the component**

```javascript
// frontend/src/components/returns/ReturnTriageCards.js
import React from 'react';
import { Row, Col } from 'react-bootstrap';
import './returns.css';

// Each bucket maps to a status filter (and optional type filter) on the list.
// `statKey` reads the count from the dashboard stats payload.
export const BUCKETS = [
  { key: 'pendingApproval', label: 'Needs Approval', statKey: 'pendingApproval', filter: { status: 'INITIATED', type: '' } },
  { key: 'pendingQC', label: 'Awaiting QC', statKey: 'pendingQC', filter: { status: 'QC_IN_PROGRESS', type: '' } },
  { key: 'pendingRefund', label: 'Refund Due', statKey: 'pendingRefund', filter: { status: 'REFUND_INITIATED', type: '' } },
  { key: 'exchanges', label: 'Exchanges', statKey: 'exchanges', filter: { status: '', type: 'EXCHANGE' } },
];

// activeKey: the currently selected bucket key (or '' for none).
const ReturnTriageCards = ({ stats, dashLoading, activeKey, onSelect }) => (
  <Row className="mb-3">
    <Col xs={6} md={3} className="mb-2">
      <div className="ret-bucket">
        <div className="ret-bucket__n">{dashLoading ? '…' : stats?.total ?? 0}</div>
        <div className="ret-bucket__t">Total</div>
      </div>
    </Col>
    {BUCKETS.map((b) => (
      <Col xs={6} md={3} className="mb-2" key={b.key}>
        <div
          className={'ret-bucket' + (activeKey === b.key ? ' ret-bucket--active' : '')}
          onClick={() => onSelect(activeKey === b.key ? null : b)}
        >
          <div className="ret-bucket__n">{dashLoading ? '…' : stats?.[b.statKey] ?? 0}</div>
          <div className="ret-bucket__t">{b.label}</div>
        </div>
      </Col>
    ))}
  </Row>
);

export default ReturnTriageCards;
```

- [ ] **Step 2: Verify lint**

Run: `cd frontend && npx eslint src/components/returns/ReturnTriageCards.js`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/returns/ReturnTriageCards.js
git commit -m "feat(returns): ReturnTriageCards clickable filter buckets

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Rework `ReturnListScreen` with triage cards + Age/Next-action columns

**Files:**
- Modify: `frontend/src/Screens/ReturnListScreen.js`

- [ ] **Step 1: Swap DashCard for ReturnTriageCards and add column helpers**

Edits to the existing file:
  1. Add imports:

```javascript
import ReturnTriageCards, { BUCKETS } from '../components/returns/ReturnTriageCards';
import buildReturnActions from '../components/returns/nextActionMap';
```

  2. Add an active-bucket state near the other useState calls:

```javascript
const [activeBucket, setActiveBucket] = useState('');
```

  3. Add a bucket select handler (sets status+type filters and triggers a fresh list):

```javascript
const handleBucketSelect = (bucket) => {
  if (!bucket) {
    setActiveBucket('');
    setStatus('');
    setType('');
    dispatch(listReturns(1, keyword, '', ''));
    return;
  }
  setActiveBucket(bucket.key);
  setStatus(bucket.filter.status);
  setType(bucket.filter.type);
  dispatch(listReturns(1, keyword, bucket.filter.status, bucket.filter.type));
};
```

  4. Add an Age helper above the component:

```javascript
const ageLabel = (createdAt) => {
  if (!createdAt) return { text: '-', stale: false };
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days <= 0) return { text: 'today', stale: false };
  return { text: `${days}d`, stale: days >= 3 };
};
```

- [ ] **Step 2: Add Age + Next-action columns to the `columns` array**

After the existing `Created` column object, add:

```javascript
{
  title: 'Age',
  field: 'createdAt',
  render: (row) => {
    const a = ageLabel(row.createdAt);
    return <span className={a.stale ? 'ret-age-stale' : ''}>{a.text}</span>;
  },
},
{
  title: 'Next',
  sorting: false,
  render: (row) => {
    const actions = buildReturnActions(row, row.nextStatuses || []);
    const primary = actions.find((x) => x.kind === 'primary');
    return primary ? <span className="ret-next-link">{primary.label.split(' · ')[0]} →</span> : '-';
  },
},
```

Note: `buildReturnActions` tolerates a missing `nextStatuses` (returns `[]`), so rows without it simply show "-". If the list payload lacks `nextStatuses`, the Next column is informational only — clicking the row still opens the detail screen where the real action lives.

- [ ] **Step 3: Replace the DashCard Row with ReturnTriageCards**

Remove the `DashCard` definition and the `<Row className="mb-3">` of DashCards; replace with:

```jsx
{dashError && <Message variant="danger">{dashError}</Message>}
<ReturnTriageCards
  stats={dashboard}
  dashLoading={dashLoading}
  activeKey={activeBucket}
  onSelect={handleBucketSelect}
/>
```

- [ ] **Step 4: Ensure manual status/type dropdown changes clear the active bucket**

In the status `<Form.Control as="select" onChange>` and type `<Form.Control as="select" onChange>`, add `setActiveBucket('')` alongside the existing setter so manual filtering deselects a bucket. Example for status:

```javascript
onChange={(e) => { setStatus(e.target.value); setActiveBucket(''); }}
```

Apply the analogous change to the type select.

- [ ] **Step 5: Run the app and verify the list**

With `npm start` running, open `http://localhost:3000/admin/returns`.
Expected: bucket cards across the top; clicking "Needs Approval" filters the table to INITIATED and highlights the card; the Age column shows day counts (red ≥3d); the Next column shows the primary action label; changing a dropdown clears the active bucket; pagination and search still work.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/Screens/ReturnListScreen.js
git commit -m "feat(returns): triage cards + Age/Next columns on returns list

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Full lifecycle manual verification + cleanup

**Files:** none (verification only)

- [ ] **Step 1: Walk a RETURN through every state**

With the app running, drive one RETURN from INITIATED → COMPLETED. At each state confirm:
- stepper advances to the right step,
- the action bar shows the correct single primary action with the right color,
- money actions show the ₹ amount,
- "Complete QC" is disabled until all items have a disposition,
- terminal COMPLETED shows the "✓ complete" bar.

- [ ] **Step 2: Verify EXCHANGE and REPLACEMENT branches**

Confirm an EXCHANGE shows "Create Exchange Order" before an order exists, then "Mark Exchange Shipped" after; REPLACEMENT shows the replacement variants. Confirm REJECTED and CANCELLED render the terminal bar + greyed stepper.

- [ ] **Step 3: Verify modals still work**

Reject (with reason), Record Refund (amount + destination shown, records), Add Note (from More menu and terminal bar) all dispatch and refetch as before.

- [ ] **Step 4: Lint the whole returns area**

Run: `cd frontend && npx eslint "src/components/returns/**/*.js" src/Screens/ReturnListScreen.js src/Screens/ReturnDetailScreen.js`
Expected: no errors.

- [ ] **Step 5: Final commit if any fixes were made**

```bash
git add -A
git commit -m "fix(returns): polish from lifecycle verification

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
```
(Skip if nothing changed.)
```

---

## Self-Review notes

- **Spec coverage:** cockpit detail (Tasks 3–5), action bar primary+More with hints/amounts (Tasks 1, 4), stepper (Task 3), triage list with buckets+Age+Next (Tasks 6–7), shared components incl. CopyRow (Task 2), no backend changes (verified — all dispatches reuse existing action creators). Refund destination reuses `renderRefundDestination` kept from the original file.
- **Coupling documented:** `nextActionMap.js` header notes the link to `returnStateMachine.js`.
- **Type consistency:** `buildReturnActions(ret, nextStatuses)` and `isTerminal(status)` signatures are used identically in Tasks 1, 4, 7. `BUCKETS` shape (`key/label/statKey/filter{status,type}`) is consistent between Tasks 6 and 7.
