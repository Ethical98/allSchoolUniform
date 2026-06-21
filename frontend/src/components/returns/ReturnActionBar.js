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
