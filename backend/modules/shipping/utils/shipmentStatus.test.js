import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStatusText, textToCode, STATUS_PRIORITY } from './shipmentStatus.js';

test('normalizeStatusText lowercases and trims', () => {
  assert.equal(normalizeStatusText('  Delivered '), 'delivered');
  assert.equal(normalizeStatusText('OUT FOR DELIVERY'), 'out for delivery');
});

test('textToCode maps known ShipRocket status strings to codes', () => {
  assert.equal(textToCode('Delivered'), 7);
  assert.equal(textToCode('out for delivery'), 17);
  assert.equal(textToCode('Shipped'), 6);
  assert.equal(textToCode('RTO Delivered'), 15);
  assert.equal(textToCode('Pickup Scheduled'), 18);
});

test('textToCode returns null for unknown text', () => {
  assert.equal(textToCode('some random courier note'), null);
  assert.equal(textToCode(''), null);
  assert.equal(textToCode(undefined), null);
});

test('STATUS_PRIORITY ranks Delivered above Out For Delivery', () => {
  assert.ok(STATUS_PRIORITY[7] > STATUS_PRIORITY[17]);
  assert.ok(STATUS_PRIORITY[15] > STATUS_PRIORITY[7]); // RTO delivered is terminal-most
});
