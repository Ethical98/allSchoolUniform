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
