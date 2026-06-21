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
