import { test } from 'node:test';
import assert from 'node:assert/strict';
import ReturnRequest from './ReturnRequestModel.js';

test('schema declares evidenceImages (H1)', () => {
  assert.ok(ReturnRequest.schema.path('evidenceImages'), 'evidenceImages must be a declared path');
});

test('schema declares refundInitiatedAt (M2)', () => {
  assert.ok(ReturnRequest.schema.path('refundInitiatedAt'), 'refundInitiatedAt must be a declared path');
});

test('schema declares reverseShipping.pickupInitiatedAt (H8)', () => {
  assert.ok(
    ReturnRequest.schema.path('reverseShipping.pickupInitiatedAt'),
    'reverseShipping.pickupInitiatedAt must be a declared path'
  );
});

test('schema declares refundLedgerPosted with default false (M-2)', () => {
  const path = ReturnRequest.schema.path('refundLedgerPosted');
  assert.ok(path, 'refundLedgerPosted must be a declared path');
  assert.equal(path.getDefault(), false, 'refundLedgerPosted must default to false');
});
