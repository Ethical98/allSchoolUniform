import React from 'react';
import { Badge } from 'react-bootstrap';

const STATUS_COLOR_MAP = {
    INITIATED: 'info',
    APPROVED: 'primary',
    PICKUP_SCHEDULED: 'primary',
    PICKUP_FAILED: 'danger',
    IN_TRANSIT: 'warning',
    RECEIVED: 'info',
    QC_IN_PROGRESS: 'warning',
    QC_COMPLETED: 'info',
    REFUND_INITIATED: 'success',
    EXCHANGE_SHIPPED: 'success',
    REPLACEMENT_SHIPPED: 'success',
    COMPLETED: 'success',
    REJECTED: 'danger',
    CANCELLED: 'secondary',
};

const ReturnStatusBadge = ({ status }) => {
    const variant = STATUS_COLOR_MAP[status] || 'secondary';
    const label = status ? status.replace(/_/g, ' ') : 'UNKNOWN';

    return (
        <Badge bg={variant} style={{ fontSize: '0.8rem', padding: '5px 8px' }}>
            {label}
        </Badge>
    );
};

export default ReturnStatusBadge;
