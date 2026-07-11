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

import { applyShipmentStatus } from './shipmentStatus.js';

// Minimal fake order shaped like the Mongoose doc fields the engine touches.
const makeOrder = (overrides = {}) => {
  const { shipping: shippingOverride, ...rest } = overrides;
  return {
    orderStatus: 'Processing',
    tracking: { isProcessing: false, isOutForDelivery: false, isDelivered: false },
    shipping: {
      status: 'AWB_ASSIGNED',
      statusCode: undefined,
      ndr: { isNDR: false, ndrCount: 0, ndrActions: [] },
      trackingHistory: [],
      errors: [],
      ...shippingOverride,
    },
    ...rest,
  };
};

test('applyShipmentStatus marks delivered from numeric code 7', () => {
  const order = makeOrder();
  const res = applyShipmentStatus(order, { code: 7, text: 'Delivered' });
  assert.equal(res.changed, true);
  assert.equal(order.tracking.isDelivered, true);
  assert.equal(order.orderStatus, 'Delivered');
  assert.equal(order.shipping.statusCode, 7);
  assert.ok(res.sideEffects.some((s) => s.type === 'email' && s.kind === 'delivered'));
});

test('applyShipmentStatus marks delivered from TEXT only (track path)', () => {
  const order = makeOrder();
  const res = applyShipmentStatus(order, { text: 'Delivered' }); // no code
  assert.equal(res.changed, true);
  assert.equal(order.tracking.isDelivered, true);
  assert.equal(order.orderStatus, 'Delivered');
  assert.equal(order.shipping.statusCode, 7);
});

test('applyShipmentStatus is monotonic — OFD after Delivered is a no-op', () => {
  const order = makeOrder({ shipping: { statusCode: 7, status: 'Delivered' } });
  order.tracking.isDelivered = true;
  order.orderStatus = 'Delivered';
  const res = applyShipmentStatus(order, { code: 17, text: 'Out for Delivery' });
  assert.equal(res.changed, false);
  assert.equal(order.orderStatus, 'Delivered');
});

test('applyShipmentStatus RTO delivered (15) returns one stock-restore side-effect', () => {
  const order = makeOrder({ shipping: { statusCode: 14, status: 'RTO Initiated' } });
  const res = applyShipmentStatus(order, { code: 15, text: 'RTO Delivered' });
  assert.equal(res.changed, true);
  const restores = res.sideEffects.filter((s) => s.type === 'restoreStockOnRTO');
  assert.equal(restores.length, 1);
});

test('applyShipmentStatus with unmappable status records string, no transition', () => {
  const order = makeOrder();
  const res = applyShipmentStatus(order, { text: 'Reached nearest hub' });
  assert.equal(res.changed, false);
  assert.equal(order.shipping.status, 'Reached nearest hub');
  assert.equal(order.tracking.isDelivered, false);
});

test('applyShipmentStatus pushes tracking history and syncedAt', () => {
  const order = makeOrder();
  applyShipmentStatus(order, { code: 6, text: 'Shipped', location: 'Delhi' });
  assert.equal(order.shipping.trackingHistory.length, 1);
  assert.equal(order.shipping.trackingHistory[0].statusCode, 6);
  assert.ok(order.shipping.syncedAt instanceof Date);
});

import { extractAwb } from '../controllers/shippingOrderController.js';

test('extractAwb pulls awb from nested response.data', () => {
  const r = extractAwb({ response: { data: { awb_code: '123', courier_name: 'Delhivery' } } });
  assert.equal(r.awbCode, '123');
  assert.equal(r.courierName, 'Delhivery');
  assert.equal(r.error, null);
});

test('extractAwb detects ShipRocket 200-body error (low balance) with no awb', () => {
  const r = extractAwb({ response: { data: {} }, awb_assign_error: 'Insufficient wallet balance' });
  assert.equal(r.awbCode, null);
  assert.equal(r.error, 'Insufficient wallet balance');
});

test('extractAwb reports missing awb even without an explicit error', () => {
  const r = extractAwb({ response: { data: {} } });
  assert.equal(r.awbCode, null);
});
