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
