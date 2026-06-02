import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeItemRefund, resolveOrderItems } from './returnPricing.js';
import { computeReturnRefund } from './returnPricing.js';
import { SELLER_FAULT_REASONS, decideShippingRefund } from './returnPricing.js';

test('computeItemRefund: price × (1 - disc%) × qty, rounded to 2dp', () => {
  // 1000 MRP, 10% off = 900/unit, x2 = 1800
  assert.equal(computeItemRefund({ price: 1000, disc: 10 }, 2), 1800);
});

test('computeItemRefund: no discount', () => {
  assert.equal(computeItemRefund({ price: 499, disc: 0 }, 1), 499);
});

test('computeItemRefund: missing disc treated as 0', () => {
  assert.equal(computeItemRefund({ price: 250 }, 3), 750);
});

test('computeItemRefund: discount clamped to 0..100', () => {
  assert.equal(computeItemRefund({ price: 100, disc: 150 }, 1), 0);
  assert.equal(computeItemRefund({ price: 100, disc: -50 }, 1), 100);
});

test('computeItemRefund: accepts `discount` alias when `disc` absent', () => {
  assert.equal(computeItemRefund({ price: 200, discount: 50 }, 1), 100);
});

test('computeItemRefund: rounds half to 2 decimals', () => {
  // 333 * (1 - 0.15) = 283.05, x1
  assert.equal(computeItemRefund({ price: 333, disc: 15 }, 1), 283.05);
});

test('resolveOrderItems: uses modifiedItems when order.modified is true and non-empty', () => {
  const order = {
    modified: true,
    orderItems: [{ product: 'a', size: 'M', qty: 1 }],
    modifiedItems: [{ product: 'b', size: 'L', qty: 2 }],
  };
  assert.deepEqual(resolveOrderItems(order), order.modifiedItems);
});

test('resolveOrderItems: falls back to orderItems when not modified', () => {
  const order = {
    modified: false,
    orderItems: [{ product: 'a', size: 'M', qty: 1 }],
    modifiedItems: [],
  };
  assert.deepEqual(resolveOrderItems(order), order.orderItems);
});

test('resolveOrderItems: falls back to orderItems when modified but modifiedItems empty', () => {
  const order = {
    modified: true,
    orderItems: [{ product: 'a', size: 'M', qty: 1 }],
    modifiedItems: [],
  };
  assert.deepEqual(resolveOrderItems(order), order.orderItems);
});

test('computeReturnRefund: sums item refunds, no QC dispositions yet', () => {
  const ret = {
    items: [
      { price: 1000, disc: 10, returnQty: 1 }, // 900
      { price: 500, disc: 0, returnQty: 2 },   // 1000
    ],
    shippingRefundAmount: 0,
  };
  const r = computeReturnRefund(ret);
  assert.equal(r.itemsRefund, 1900);
  assert.equal(r.shippingRefund, 0);
  assert.equal(r.total, 1900);
});

test('computeReturnRefund: NOT_RECEIVED and UNSELLABLE contribute 0', () => {
  const ret = {
    items: [
      { price: 1000, disc: 0, returnQty: 1, qcDisposition: 'GOOD' },        // 1000
      { price: 1000, disc: 0, returnQty: 1, qcDisposition: 'DAMAGED' },     // 1000
      { price: 1000, disc: 0, returnQty: 1, qcDisposition: 'UNSELLABLE' },  // 0
      { price: 1000, disc: 0, returnQty: 1, qcDisposition: 'NOT_RECEIVED' },// 0
    ],
    shippingRefundAmount: 50,
  };
  const r = computeReturnRefund(ret);
  assert.equal(r.itemsRefund, 2000);
  assert.equal(r.shippingRefund, 50);
  assert.equal(r.total, 2050);
});

test('computeReturnRefund: PENDING/GOOD treated as refundable', () => {
  const ret = {
    items: [
      { price: 100, disc: 0, returnQty: 1, qcDisposition: 'PENDING' }, // 100
    ],
  };
  assert.equal(computeReturnRefund(ret).itemsRefund, 100);
});

test('SELLER_FAULT_REASONS contains the three seller-fault reasons', () => {
  assert.deepEqual([...SELLER_FAULT_REASONS].sort(), ['DAMAGED_IN_TRANSIT', 'DEFECTIVE', 'WRONG_ITEM']);
});

test('decideShippingRefund: seller-fault reason refunds shipping regardless of allReturned', () => {
  assert.equal(decideShippingRefund('DEFECTIVE', false), true);
});

test('decideShippingRefund: non-seller-fault refunds shipping only when all items returned', () => {
  assert.equal(decideShippingRefund('CHANGED_MIND', true), true);
  assert.equal(decideShippingRefund('CHANGED_MIND', false), false);
});
