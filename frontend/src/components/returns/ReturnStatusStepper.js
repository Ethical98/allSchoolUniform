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
