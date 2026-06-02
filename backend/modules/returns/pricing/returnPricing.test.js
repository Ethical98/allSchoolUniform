import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeItemRefund } from './returnPricing.js';

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
