import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidUpiId,
  isValidIfsc,
  isValidAccountNumber,
  isValidAccountHolder,
  validateRefundDestination,
} from './refundDestination.js';
import { formatRefundDestination } from './refundDestination.js';

test('isValidUpiId accepts a standard VPA', () => {
  assert.equal(isValidUpiId('rahul.k@okhdfcbank'), true);
});
test('isValidUpiId rejects missing handle', () => {
  assert.equal(isValidUpiId('rahul.k@'), false);
  assert.equal(isValidUpiId('nope'), false);
});
test('isValidIfsc enforces the 11-char bank format', () => {
  assert.equal(isValidIfsc('HDFC0001234'), true);
  // self-normalizes case (mirrors the frontend isValidIfsc), so lowercase is accepted
  assert.equal(isValidIfsc('hdfc0001234'), true);
  assert.equal(isValidIfsc('HDFC1001234'), false); // 5th char must be 0
  assert.equal(isValidIfsc('NOPE'), false);
});
test('isValidAccountNumber wants 9-18 digits', () => {
  assert.equal(isValidAccountNumber('123456789'), true);
  assert.equal(isValidAccountNumber('1234'), false);
  assert.equal(isValidAccountNumber('12a456789'), false);
});
test('isValidAccountHolder needs >=2 trimmed chars', () => {
  assert.equal(isValidAccountHolder('  A '), false);
  assert.equal(isValidAccountHolder('Jo'), true);
});
test('validateRefundDestination: prepaid ignores fields', () => {
  const r = validateRefundDestination({ paymentMethod: 'PREPAID' });
  assert.equal(r.ok, true);
});
test('validateRefundDestination: COD UPI happy path', () => {
  const r = validateRefundDestination({
    paymentMethod: 'COD', refundMethod: 'UPI', refundUpiId: 'a.b@oksbi',
  });
  assert.equal(r.ok, true);
  assert.equal(r.normalized.refundMethod, 'UPI');
  assert.equal(r.normalized.refundUpiId, 'a.b@oksbi');
});
test('validateRefundDestination: COD bank uppercases IFSC', () => {
  const r = validateRefundDestination({
    paymentMethod: 'COD', refundMethod: 'BANK_TRANSFER',
    refundBankDetails: { accountHolderName: 'Jo', accountNumber: '123456789', ifscCode: 'hdfc0001234' },
  });
  assert.equal(r.ok, true);
  assert.equal(r.normalized.refundBankDetails.ifscCode, 'HDFC0001234');
});
test('validateRefundDestination: COD missing destination fails', () => {
  const r = validateRefundDestination({ paymentMethod: 'COD' });
  assert.equal(r.ok, false);
  assert.match(r.error, /refund/i);
});
test('validateRefundDestination: COD bad UPI fails', () => {
  const r = validateRefundDestination({ paymentMethod: 'COD', refundMethod: 'UPI', refundUpiId: 'bad' });
  assert.equal(r.ok, false);
});

test('formatRefundDestination: COD UPI', () => {
  const r = formatRefundDestination({ refundMethod: 'UPI', refundUpiId: 'rahul@oksbi' });
  assert.equal(r.text, 'UPI: rahul@oksbi');
  assert.equal(r.hasCustomerDestination, true);
});
test('formatRefundDestination: COD bank masks account to last 4, keeps IFSC', () => {
  const r = formatRefundDestination({
    refundMethod: 'BANK_TRANSFER',
    refundBankDetails: { accountHolderName: 'Rahul K', accountNumber: '123456789012', ifscCode: 'HDFC0001234' },
  });
  assert.equal(r.text, 'Rahul K · Bank A/C ••••9012 · IFSC HDFC0001234');
  assert.equal(r.hasCustomerDestination, true);
});
test('formatRefundDestination: bank without holder name omits the name segment', () => {
  const r = formatRefundDestination({
    refundMethod: 'BANK_TRANSFER',
    refundBankDetails: { accountNumber: '99887766', ifscCode: 'SBIN0000456' },
  });
  assert.equal(r.text, 'Bank A/C ••••7766 · IFSC SBIN0000456');
  assert.equal(r.hasCustomerDestination, true);
});
test('formatRefundDestination: prepaid / no destination falls back to original payment', () => {
  const r = formatRefundDestination({ refundMethod: 'ORIGINAL_PAYMENT' });
  assert.equal(r.text, 'your original payment method');
  assert.equal(r.hasCustomerDestination, false);
  const empty = formatRefundDestination({});
  assert.equal(empty.text, 'your original payment method');
  assert.equal(empty.hasCustomerDestination, false);
});
