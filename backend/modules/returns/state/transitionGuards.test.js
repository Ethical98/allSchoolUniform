import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canInitiateRefund } from './transitionGuards.js';

test('canInitiateRefund: RETURN type is always allowed', () => {
  assert.deepEqual(canInitiateRefund({ type: 'RETURN' }, null), { ok: true });
});

test('canInitiateRefund: EXCHANGE with no exchange order is allowed', () => {
  assert.deepEqual(canInitiateRefund({ type: 'EXCHANGE', exchangeOrderId: null }, null), { ok: true });
});

test('canInitiateRefund: EXCHANGE with a live (non-cancelled) exchange order is blocked', () => {
  const ret = { type: 'EXCHANGE', exchangeOrderId: 'x1' };
  const exchangeOrder = { tracking: { isCanceled: false } };
  const result = canInitiateRefund(ret, exchangeOrder);
  assert.equal(result.ok, false);
  assert.match(result.reason, /exchange order/i);
});

test('canInitiateRefund: EXCHANGE whose exchange order is cancelled is allowed', () => {
  const ret = { type: 'EXCHANGE', exchangeOrderId: 'x1' };
  const exchangeOrder = { tracking: { isCanceled: true } };
  assert.deepEqual(canInitiateRefund(ret, exchangeOrder), { ok: true });
});

test('canInitiateRefund: REPLACEMENT with a live exchange order is blocked', () => {
  const ret = { type: 'REPLACEMENT', exchangeOrderId: 'x1' };
  assert.equal(canInitiateRefund(ret, { tracking: {} }).ok, false);
});
