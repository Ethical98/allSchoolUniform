import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeItemRefund,
  resolveOrderItems,
  computeReturnRefund,
  SELLER_FAULT_REASONS,
  decideShippingRefund,
  resolveQcQty,
} from './returnPricing.js';

// Refund equals what the customer actually PAID for the line, matching the
// order-details display (OrderItemsList): price*qty - round(price*qty*disc/100).
test('computeItemRefund: price*qty minus rounded line discount', () => {
  // 1000 MRP, 10% off, x2: 2000 - round(200) = 1800
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

test('computeItemRefund: matches paid price when line discount has a half-rupee', () => {
  // The reported bug: 99, 25% off, qty 2.
  // Paid (order details): 198 - round(49.5)=50 = 148  (NOT 148.5 from per-unit rounding)
  assert.equal(computeItemRefund({ price: 99, disc: 25 }, 2), 148);
  // 333, 15%, qty 1: 333 - round(49.95)=50 = 283  (NOT 283.05)
  assert.equal(computeItemRefund({ price: 333, disc: 15 }, 1), 283);
  // 199, 10%, qty 5: 995 - round(99.5)=100 = 895
  assert.equal(computeItemRefund({ price: 199, disc: 10 }, 5), 895);
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
  assert.equal(r.shippingRefund, 0);
  assert.equal(r.total, 2000);
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

test('resolveQcQty: uses acceptedQty when finite', () => {
  assert.equal(resolveQcQty({ returnQty: 3, acceptedQty: 1 }), 1);
});

test('resolveQcQty: accepts 0 as a valid accepted qty', () => {
  assert.equal(resolveQcQty({ returnQty: 3, acceptedQty: 0 }), 0);
});

test('resolveQcQty: falls back to returnQty when acceptedQty unset', () => {
  assert.equal(resolveQcQty({ returnQty: 3 }), 3);
});

test('computeReturnRefund: shipping is always 0', () => {
  const ret = {
    items: [{ price: 1000, disc: 0, returnQty: 1, qcDisposition: 'GOOD' }],
    shippingRefundAmount: 50,
  };
  const r = computeReturnRefund(ret);
  assert.equal(r.shippingRefund, 0);
  assert.equal(r.total, r.itemsRefund);
});

test('computeReturnRefund: QC-adjusted uses acceptedQty', () => {
  const ret = {
    items: [{ price: 1000, disc: 0, returnQty: 3, acceptedQty: 1, qcDisposition: 'GOOD' }],
  };
  assert.equal(computeReturnRefund(ret).itemsRefund, 1000);
});

test('computeReturnRefund: acceptedQty 0 contributes 0', () => {
  const ret = {
    items: [{ price: 1000, disc: 0, returnQty: 2, acceptedQty: 0, qcDisposition: 'GOOD' }],
  };
  assert.equal(computeReturnRefund(ret).itemsRefund, 0);
});

test('computeReturnRefund: fullRefundOverride ignores accepted qty and disposition', () => {
  const ret = {
    fullRefundOverride: true,
    items: [
      { price: 1000, disc: 0, returnQty: 3, acceptedQty: 1, qcDisposition: 'UNSELLABLE' },
      { price: 500, disc: 0, returnQty: 1, qcDisposition: 'NOT_RECEIVED' },
    ],
    shippingRefundAmount: 99,
  };
  const r = computeReturnRefund(ret);
  assert.equal(r.itemsRefund, 3500);
  assert.equal(r.shippingRefund, 0);
  assert.equal(r.total, 3500);
});

test('computeReturnRefund: QC-adjusted mixes reduced accepted qty with a non-refundable item', () => {
  const ret = {
    items: [
      { price: 1000, disc: 0, returnQty: 3, acceptedQty: 2, qcDisposition: 'GOOD' }, // 2000
      { price: 500, disc: 0, returnQty: 1, qcDisposition: 'UNSELLABLE' },            // 0
    ],
  };
  assert.equal(computeReturnRefund(ret).itemsRefund, 2000);
});
