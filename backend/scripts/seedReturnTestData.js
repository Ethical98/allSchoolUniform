/**
 * Return / Exchange / Replacement — End-to-End Test Data Seeder
 *
 * Creates realistic test data covering EVERY scenario:
 * - Happy path returns, exchanges, replacements
 * - Edge cases: partial returns, expired window, over-return, COD, multi-return
 * - Exchange with price difference, inactive product, out-of-stock
 * - Orders at various delivery stages
 *
 * Usage:
 *   node --experimental-modules scripts/seedReturnTestData.js          # Seed data
 *   node --experimental-modules scripts/seedReturnTestData.js --clean  # Remove all test data
 *
 * All test data is tagged with "RETURN_TEST_" prefix for safe cleanup.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import colors from 'colors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import connectDB from '../config/db.js';
import User from '../models/UserModel.js';
import Product from '../models/ProductModel.js';
import Order from '../models/OrderModel.js';

const TEST_PREFIX = 'RETURN_TEST_';
const TEST_PHONE_PREFIX = '00000';

// ─────────────────────────────────────────────────────────────────────────
// Test Admin & Customer Users
// ─────────────────────────────────────────────────────────────────────────
const testUsers = [
  {
    name: `${TEST_PREFIX}Admin`,
    email: `${TEST_PREFIX.toLowerCase()}admin@test.com`,
    phone: `${TEST_PHONE_PREFIX}10001`,
    password: 'Test@123',
    isAdmin: true,
    authMethod: 'password',
    isProfileComplete: true,
  },
  {
    name: `${TEST_PREFIX}Customer_Ravi`,
    email: `${TEST_PREFIX.toLowerCase()}ravi@test.com`,
    phone: `${TEST_PHONE_PREFIX}10002`,
    password: 'Test@123',
    isAdmin: false,
    authMethod: 'password',
    isProfileComplete: true,
  },
  {
    name: `${TEST_PREFIX}Customer_Priya`,
    email: `${TEST_PREFIX.toLowerCase()}priya@test.com`,
    phone: `${TEST_PHONE_PREFIX}10003`,
    password: 'Test@123',
    isAdmin: false,
    authMethod: 'password',
    isProfileComplete: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Test Products (with various stock levels)
// ─────────────────────────────────────────────────────────────────────────
const createTestProducts = (adminId) => [
  {
    user: adminId,
    SKU: `${TEST_PREFIX}SKU-SHIRT-001`,
    name: `${TEST_PREFIX}White School Shirt`,
    type: 'Shirt',
    image: '/uploads/test-shirt.jpg',
    brand: 'ASU',
    category: 'Uniforms',
    description: 'Test white school shirt for return testing',
    season: 'All',
    class: ['5', '6', '7'],
    schoolName: ['Test School A'],
    isActive: true,
    outOfStock: false,
    rating: 0,
    numReviews: 0,
    size: [
      { size: '28', price: 450, countInStock: 50, quantityOnHand: 50, committed: 0, damaged: 0, safetyStock: 2, costPrice: 200, discount: 0, tax: 5, alertOnQty: 5 },
      { size: '30', price: 450, countInStock: 40, quantityOnHand: 40, committed: 0, damaged: 0, safetyStock: 2, costPrice: 200, discount: 0, tax: 5, alertOnQty: 5 },
      { size: '32', price: 500, countInStock: 30, quantityOnHand: 30, committed: 0, damaged: 0, safetyStock: 2, costPrice: 220, discount: 0, tax: 5, alertOnQty: 5 },
      { size: '34', price: 500, countInStock: 20, quantityOnHand: 20, committed: 0, damaged: 0, safetyStock: 2, costPrice: 220, discount: 10, tax: 5, alertOnQty: 5 },
    ],
  },
  {
    user: adminId,
    SKU: `${TEST_PREFIX}SKU-PANT-001`,
    name: `${TEST_PREFIX}Grey School Trousers`,
    type: 'Trouser',
    image: '/uploads/test-trouser.jpg',
    brand: 'ASU',
    category: 'Uniforms',
    description: 'Test grey school trousers for return testing',
    season: 'All',
    class: ['5', '6', '7'],
    schoolName: ['Test School A'],
    isActive: true,
    outOfStock: false,
    rating: 0,
    numReviews: 0,
    size: [
      { size: '28', price: 550, countInStock: 35, quantityOnHand: 35, committed: 0, damaged: 0, safetyStock: 2, costPrice: 250, discount: 0, tax: 5, alertOnQty: 5 },
      { size: '30', price: 550, countInStock: 25, quantityOnHand: 25, committed: 0, damaged: 0, safetyStock: 2, costPrice: 250, discount: 0, tax: 5, alertOnQty: 5 },
      { size: '32', price: 600, countInStock: 15, quantityOnHand: 15, committed: 0, damaged: 0, safetyStock: 2, costPrice: 270, discount: 5, tax: 5, alertOnQty: 5 },
    ],
  },
  {
    user: adminId,
    SKU: `${TEST_PREFIX}SKU-TIE-001`,
    name: `${TEST_PREFIX}School Tie Blue`,
    type: 'Accessories',
    image: '/uploads/test-tie.jpg',
    brand: 'ASU',
    category: 'Accessories',
    description: 'Test school tie for return testing',
    season: 'All',
    class: ['5', '6', '7'],
    schoolName: ['Test School A'],
    isActive: true,
    outOfStock: false,
    rating: 0,
    numReviews: 0,
    size: [
      { size: 'Standard', price: 150, countInStock: 100, quantityOnHand: 100, committed: 0, damaged: 0, safetyStock: 5, costPrice: 50, discount: 0, tax: 12, alertOnQty: 10 },
    ],
  },
  {
    user: adminId,
    SKU: `${TEST_PREFIX}SKU-SHOE-001`,
    name: `${TEST_PREFIX}Black School Shoes`,
    type: 'Shoes',
    image: '/uploads/test-shoes.jpg',
    brand: 'ASU',
    category: 'Footwear',
    description: 'Test black school shoes — EXCHANGE TARGET with higher price',
    season: 'All',
    class: ['5', '6', '7'],
    schoolName: ['Test School A'],
    isActive: true,
    outOfStock: false,
    rating: 0,
    numReviews: 0,
    size: [
      { size: '6', price: 800, countInStock: 10, quantityOnHand: 10, committed: 0, damaged: 0, safetyStock: 1, costPrice: 400, discount: 0, tax: 18, alertOnQty: 3 },
      { size: '7', price: 800, countInStock: 8, quantityOnHand: 8, committed: 0, damaged: 0, safetyStock: 1, costPrice: 400, discount: 0, tax: 18, alertOnQty: 3 },
      { size: '8', price: 850, countInStock: 2, quantityOnHand: 2, committed: 0, damaged: 0, safetyStock: 1, costPrice: 420, discount: 0, tax: 18, alertOnQty: 3 },
    ],
  },
  {
    user: adminId,
    SKU: `${TEST_PREFIX}SKU-INACTIVE-001`,
    name: `${TEST_PREFIX}Discontinued Jacket`,
    type: 'Jacket',
    image: '/uploads/test-jacket.jpg',
    brand: 'ASU',
    category: 'Uniforms',
    description: 'INACTIVE product — tests exchange to discontinued product edge case',
    season: 'Winter',
    class: ['5', '6', '7'],
    schoolName: ['Test School A'],
    isActive: false, // ← INACTIVE
    outOfStock: true,
    rating: 0,
    numReviews: 0,
    size: [
      { size: 'M', price: 1200, countInStock: 0, quantityOnHand: 0, committed: 0, damaged: 0, safetyStock: 0, costPrice: 600, discount: 0, tax: 5, alertOnQty: 0 },
    ],
  },
  {
    user: adminId,
    SKU: `${TEST_PREFIX}SKU-OOS-001`,
    name: `${TEST_PREFIX}Socks White (Out of Stock)`,
    type: 'Socks',
    image: '/uploads/test-socks.jpg',
    brand: 'ASU',
    category: 'Accessories',
    description: 'OUT OF STOCK product — tests exchange stock validation edge case',
    season: 'All',
    class: ['5', '6', '7'],
    schoolName: ['Test School A'],
    isActive: true,
    outOfStock: true,
    rating: 0,
    numReviews: 0,
    size: [
      { size: 'Free', price: 99, countInStock: 0, quantityOnHand: 0, committed: 0, damaged: 0, safetyStock: 0, costPrice: 30, discount: 0, tax: 5, alertOnQty: 5 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Test Orders — each designed for a specific test scenario
// ─────────────────────────────────────────────────────────────────────────
const createTestOrders = (customerId1, customerId2, products) => {
  const [shirt, trouser, tie, shoes] = products;
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);

  const addr = {
    address: '42 MG Road, Sector 14',
    city: 'Gurgaon',
    state: 'Haryana',
    postalCode: '122001',
    country: 'India',
  };

  return [
    // ── ORDER 1: Happy Path RETURN (delivered 2 days ago, within window) ──
    {
      _scenario: 'HAPPY_RETURN — Multi-item, delivered 2 days ago. Return any items.',
      user: customerId1,
      name: `${TEST_PREFIX}Customer_Ravi`,
      phone: `${TEST_PHONE_PREFIX}10002`,
      orderItems: [
        { name: shirt.name, qty: 3, image: shirt.image, price: 450, size: '28', product: shirt._id, tax: 5, disc: 0, productCode: shirt.SKU },
        { name: trouser.name, qty: 2, image: trouser.image, price: 550, size: '28', product: trouser._id, tax: 5, disc: 0, productCode: trouser.SKU },
        { name: tie.name, qty: 1, image: tie.image, price: 150, size: 'Standard', product: tie._id, tax: 12, disc: 0, productCode: tie.SKU },
      ],
      shippingAddress: addr,
      paymentMethod: 'Razorpay',
      orderStatus: 'Delivered',
      taxPrice: 0,
      shippingPrice: 50,
      totalPrice: 2650,
      isPaid: true,
      paidAt: fiveDaysAgo,
      billType: 'CGST',
      tracking: { isConfirmed: true, confirmedAt: fiveDaysAgo, isProcessing: true, processedAt: fiveDaysAgo, isOutForDelivery: true, outForDeliveryAt: twoDaysAgo, isDelivered: true, deliveredAt: twoDaysAgo, isCanceled: false },
    },

    // ── ORDER 2: Happy Path EXCHANGE (delivered 5 days ago, within window) ──
    {
      _scenario: 'HAPPY_EXCHANGE — Exchange shirt size 30→32 (same price). Delivered 5 days ago.',
      user: customerId1,
      name: `${TEST_PREFIX}Customer_Ravi`,
      phone: `${TEST_PHONE_PREFIX}10002`,
      orderItems: [
        { name: shirt.name, qty: 2, image: shirt.image, price: 450, size: '30', product: shirt._id, tax: 5, disc: 0, productCode: shirt.SKU },
      ],
      shippingAddress: addr,
      paymentMethod: 'Razorpay',
      orderStatus: 'Delivered',
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 900,
      isPaid: true,
      paidAt: fiveDaysAgo,
      billType: 'CGST',
      tracking: { isConfirmed: true, confirmedAt: fiveDaysAgo, isProcessing: true, processedAt: fiveDaysAgo, isOutForDelivery: true, outForDeliveryAt: fiveDaysAgo, isDelivered: true, deliveredAt: fiveDaysAgo, isCanceled: false },
    },

    // ── ORDER 3: Happy Path REPLACEMENT (defective item, delivered 3 days ago) ──
    {
      _scenario: 'HAPPY_REPLACEMENT — Defective trouser, same item sent again. Delivered 3 days ago.',
      user: customerId2,
      name: `${TEST_PREFIX}Customer_Priya`,
      phone: `${TEST_PHONE_PREFIX}10003`,
      orderItems: [
        { name: trouser.name, qty: 1, image: trouser.image, price: 600, size: '32', product: trouser._id, tax: 5, disc: 5, productCode: trouser.SKU },
      ],
      shippingAddress: { ...addr, address: '88 Sohna Road', city: 'Gurgaon' },
      paymentMethod: 'Razorpay',
      orderStatus: 'Delivered',
      taxPrice: 0,
      shippingPrice: 50,
      totalPrice: 620,
      isPaid: true,
      paidAt: fiveDaysAgo,
      billType: 'IGST',
      tracking: { isConfirmed: true, confirmedAt: fiveDaysAgo, isProcessing: true, processedAt: fiveDaysAgo, isOutForDelivery: true, outForDeliveryAt: fiveDaysAgo, isDelivered: true, deliveredAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), isCanceled: false },
    },

    // ── ORDER 4: EXPIRED RETURN WINDOW (delivered 10 days ago) ──
    {
      _scenario: 'EXPIRED_WINDOW — Delivered 10 days ago. Should block unless admin overrides.',
      user: customerId1,
      name: `${TEST_PREFIX}Customer_Ravi`,
      phone: `${TEST_PHONE_PREFIX}10002`,
      orderItems: [
        { name: shirt.name, qty: 1, image: shirt.image, price: 500, size: '32', product: shirt._id, tax: 5, disc: 0, productCode: shirt.SKU },
        { name: tie.name, qty: 2, image: tie.image, price: 150, size: 'Standard', product: tie._id, tax: 12, disc: 0, productCode: tie.SKU },
      ],
      shippingAddress: addr,
      paymentMethod: 'Razorpay',
      orderStatus: 'Delivered',
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 800,
      isPaid: true,
      paidAt: twentyDaysAgo,
      billType: 'CGST',
      tracking: { isConfirmed: true, confirmedAt: twentyDaysAgo, isProcessing: true, processedAt: twentyDaysAgo, isOutForDelivery: true, outForDeliveryAt: tenDaysAgo, isDelivered: true, deliveredAt: tenDaysAgo, isCanceled: false },
    },

    // ── ORDER 5: COD ORDER (for testing COD refund flow) ──
    {
      _scenario: 'COD_REFUND — Cash on Delivery order. Refund needs bank details / UPI.',
      user: customerId2,
      name: `${TEST_PREFIX}Customer_Priya`,
      phone: `${TEST_PHONE_PREFIX}10003`,
      orderItems: [
        { name: shirt.name, qty: 2, image: shirt.image, price: 450, size: '28', product: shirt._id, tax: 5, disc: 0, productCode: shirt.SKU },
        { name: trouser.name, qty: 1, image: trouser.image, price: 550, size: '30', product: trouser._id, tax: 5, disc: 0, productCode: trouser.SKU },
      ],
      shippingAddress: { ...addr, address: '12 Nehru Place', city: 'Delhi', state: 'Delhi', postalCode: '110019' },
      paymentMethod: 'COD',
      orderStatus: 'Delivered',
      taxPrice: 0,
      shippingPrice: 50,
      totalPrice: 1500,
      isPaid: true,
      paidAt: twoDaysAgo,
      billType: 'CGST',
      tracking: { isConfirmed: true, confirmedAt: fiveDaysAgo, isProcessing: true, processedAt: fiveDaysAgo, isOutForDelivery: true, outForDeliveryAt: twoDaysAgo, isDelivered: true, deliveredAt: twoDaysAgo, isCanceled: false },
    },

    // ── ORDER 6: PARTIAL RETURN + MULTI-RETURN (large order, return items in batches) ──
    {
      _scenario: 'PARTIAL_MULTI_RETURN — 5 items. Return 2 now, then 1 later. Tests over-return check.',
      user: customerId1,
      name: `${TEST_PREFIX}Customer_Ravi`,
      phone: `${TEST_PHONE_PREFIX}10002`,
      orderItems: [
        { name: shirt.name, qty: 3, image: shirt.image, price: 450, size: '28', product: shirt._id, tax: 5, disc: 0, productCode: shirt.SKU },
        { name: trouser.name, qty: 2, image: trouser.image, price: 550, size: '28', product: trouser._id, tax: 5, disc: 0, productCode: trouser.SKU },
        { name: tie.name, qty: 4, image: tie.image, price: 150, size: 'Standard', product: tie._id, tax: 12, disc: 0, productCode: tie.SKU },
        { name: shirt.name, qty: 1, image: shirt.image, price: 500, size: '34', product: shirt._id, tax: 5, disc: 10, productCode: shirt.SKU },
        { name: trouser.name, qty: 1, image: trouser.image, price: 600, size: '32', product: trouser._id, tax: 5, disc: 5, productCode: trouser.SKU },
      ],
      shippingAddress: addr,
      paymentMethod: 'Razorpay',
      orderStatus: 'Delivered',
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 4070,
      isPaid: true,
      paidAt: fiveDaysAgo,
      billType: 'CGST',
      tracking: { isConfirmed: true, confirmedAt: fiveDaysAgo, isProcessing: true, processedAt: fiveDaysAgo, isOutForDelivery: true, outForDeliveryAt: twoDaysAgo, isDelivered: true, deliveredAt: twoDaysAgo, isCanceled: false },
    },

    // ── ORDER 7: EXCHANGE WITH PRICE DIFFERENCE (exchange shirt→shoes, more expensive) ──
    {
      _scenario: 'EXCHANGE_PRICE_DIFF — Exchange shirt (₹450) for shoes (₹800). Customer owes ₹350.',
      user: customerId2,
      name: `${TEST_PREFIX}Customer_Priya`,
      phone: `${TEST_PHONE_PREFIX}10003`,
      orderItems: [
        { name: shirt.name, qty: 1, image: shirt.image, price: 450, size: '30', product: shirt._id, tax: 5, disc: 0, productCode: shirt.SKU },
      ],
      shippingAddress: { ...addr, address: '88 Sohna Road' },
      paymentMethod: 'Razorpay',
      orderStatus: 'Delivered',
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 450,
      isPaid: true,
      paidAt: fiveDaysAgo,
      billType: 'CGST',
      tracking: { isConfirmed: true, confirmedAt: fiveDaysAgo, isProcessing: true, processedAt: fiveDaysAgo, isOutForDelivery: true, outForDeliveryAt: fiveDaysAgo, isDelivered: true, deliveredAt: fiveDaysAgo, isCanceled: false },
    },

    // ── ORDER 8: NOT YET DELIVERED (should block return creation) ──
    {
      _scenario: 'NOT_DELIVERED — In transit. Return button should NOT appear. Return API should reject.',
      user: customerId1,
      name: `${TEST_PREFIX}Customer_Ravi`,
      phone: `${TEST_PHONE_PREFIX}10002`,
      orderItems: [
        { name: shirt.name, qty: 1, image: shirt.image, price: 450, size: '28', product: shirt._id, tax: 5, disc: 0, productCode: shirt.SKU },
      ],
      shippingAddress: addr,
      paymentMethod: 'Razorpay',
      orderStatus: 'Shipped',
      taxPrice: 0,
      shippingPrice: 50,
      totalPrice: 500,
      isPaid: true,
      paidAt: twoDaysAgo,
      billType: 'CGST',
      tracking: { isConfirmed: true, confirmedAt: twoDaysAgo, isProcessing: true, processedAt: twoDaysAgo, isOutForDelivery: true, outForDeliveryAt: now, isDelivered: false, isCanceled: false },
    },

    // ── ORDER 9: CANCELLED ORDER (should block return creation) ──
    {
      _scenario: 'CANCELLED_ORDER — Already cancelled. Return API should reject.',
      user: customerId2,
      name: `${TEST_PREFIX}Customer_Priya`,
      phone: `${TEST_PHONE_PREFIX}10003`,
      orderItems: [
        { name: trouser.name, qty: 1, image: trouser.image, price: 550, size: '28', product: trouser._id, tax: 5, disc: 0, productCode: trouser.SKU },
      ],
      shippingAddress: addr,
      paymentMethod: 'Razorpay',
      orderStatus: 'Cancelled',
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 550,
      isPaid: true,
      paidAt: fiveDaysAgo,
      billType: 'CGST',
      tracking: { isConfirmed: true, confirmedAt: fiveDaysAgo, isProcessing: false, isOutForDelivery: false, isDelivered: false, isCanceled: true, canceledAt: twoDaysAgo },
    },

    // ── ORDER 10: DISCOUNT ORDER (tests correct refund at discounted price) ──
    {
      _scenario: 'DISCOUNTED_ITEMS — Items with 10% discount. Refund should be discounted price, NOT MRP.',
      user: customerId1,
      name: `${TEST_PREFIX}Customer_Ravi`,
      phone: `${TEST_PHONE_PREFIX}10002`,
      orderItems: [
        { name: shirt.name, qty: 2, image: shirt.image, price: 500, size: '34', product: shirt._id, tax: 5, disc: 10, productCode: shirt.SKU },
        { name: trouser.name, qty: 1, image: trouser.image, price: 600, size: '32', product: trouser._id, tax: 5, disc: 5, productCode: trouser.SKU },
      ],
      shippingAddress: addr,
      paymentMethod: 'Razorpay',
      orderStatus: 'Delivered',
      taxPrice: 0,
      shippingPrice: 50,
      totalPrice: 1520,
      isPaid: true,
      paidAt: fiveDaysAgo,
      billType: 'IGST',
      tracking: { isConfirmed: true, confirmedAt: fiveDaysAgo, isProcessing: true, processedAt: fiveDaysAgo, isOutForDelivery: true, outForDeliveryAt: twoDaysAgo, isDelivered: true, deliveredAt: twoDaysAgo, isCanceled: false },
    },
  ];
};

// ─────────────────────────────────────────────────────────────────────────
// Seed function
// ─────────────────────────────────────────────────────────────────────────
const seed = async () => {
  await connectDB();

  console.log('\n🌱 Seeding Return/Exchange test data...\n'.green.bold);

  // Clean existing test data first
  await clean(false);

  // 1. Create test users
  const hashedPassword = await bcrypt.hash('Test@123', 10);
  const usersToCreate = testUsers.map((u) => ({ ...u, password: hashedPassword }));
  const createdUsers = await User.insertMany(usersToCreate);
  const admin = createdUsers.find((u) => u.isAdmin);
  const customer1 = createdUsers.find((u) => u.phone === `${TEST_PHONE_PREFIX}10002`);
  const customer2 = createdUsers.find((u) => u.phone === `${TEST_PHONE_PREFIX}10003`);

  console.log(`  ✅ Created ${createdUsers.length} test users`.green);
  console.log(`     Admin:    ${admin.name} (${admin.email})`.gray);
  console.log(`     Customer: ${customer1.name} (${customer1.email})`.gray);
  console.log(`     Customer: ${customer2.name} (${customer2.email})`.gray);

  // 2. Create test products
  const productData = createTestProducts(admin._id);
  const createdProducts = await Product.insertMany(productData);

  console.log(`  ✅ Created ${createdProducts.length} test products`.green);
  createdProducts.forEach((p) => {
    const stockInfo = p.size.map((s) => `${s.size}(${s.countInStock})`).join(', ');
    console.log(`     ${p.isActive ? '🟢' : '🔴'} ${p.name} — ${stockInfo}`.gray);
  });

  // 3. Create test orders (one-by-one with .save() to trigger pre-save hook for orderId generation)
  const activeProducts = createdProducts.filter((p) => p.name.indexOf('Discontinued') === -1 && p.name.indexOf('Out of Stock') === -1);
  const orderData = createTestOrders(customer1._id, customer2._id, activeProducts);

  const scenarios = orderData.map((o) => o._scenario);
  const createdOrders = [];
  for (const { _scenario, ...rest } of orderData) {
    const order = new Order(rest);
    await order.save(); // Triggers pre-save hook → generates orderId
    createdOrders.push(order);
  }

  console.log(`\n  ✅ Created ${createdOrders.length} test orders\n`.green);

  // 4. Print test scenario guide
  console.log('━'.repeat(80).cyan);
  console.log('  📋 TEST SCENARIO GUIDE'.cyan.bold);
  console.log('━'.repeat(80).cyan);
  console.log(`\n  🔑 Admin Login: ${admin.email} / Test@123\n`.yellow);

  createdOrders.forEach((order, i) => {
    const scenario = scenarios[i];
    const delivered = order.tracking?.isDelivered;
    const cancelled = order.tracking?.isCanceled;
    const deliveredAt = order.tracking?.deliveredAt ? order.tracking.deliveredAt.toLocaleDateString('en-IN') : 'N/A';
    const payment = order.paymentMethod;
    const items = order.orderItems.map((oi) => `${oi.name.replace(TEST_PREFIX, '')} x${oi.qty} (${oi.size})`).join(', ');

    console.log(`  ┌─ ORDER ${i + 1}: ${order.orderId}`.white.bold);
    console.log(`  │  Scenario: ${scenario}`.yellow);
    console.log(`  │  Customer: ${order.name.replace(TEST_PREFIX, '')} | Payment: ${payment}`);
    console.log(`  │  Status: ${delivered ? '✅ Delivered' : cancelled ? '❌ Cancelled' : '🚚 In Transit'} ${delivered ? `on ${deliveredAt}` : ''}`);
    console.log(`  │  Items: ${items}`);
    console.log(`  │  Total: ₹${order.totalPrice} (Tax: ₹${order.taxPrice}, Shipping: ₹${order.shippingPrice})`);

    // Print what to test
    switch (i) {
      case 0:
        console.log(`  │  📝 TEST: Create RETURN for 1-2 items → Approve → Schedule Pickup → Receive → QC (mix GOOD/DAMAGED) → Refund`.green);
        break;
      case 1:
        console.log(`  │  📝 TEST: Create EXCHANGE → pick different size (32) → Approve → full QC flow → Create Exchange Order → Ship`.green);
        break;
      case 2:
        console.log(`  │  📝 TEST: Create REPLACEMENT (reason: DEFECTIVE) → Approve → QC → Create Replacement Order → Ship`.green);
        break;
      case 3:
        console.log(`  │  📝 TEST: Try return WITHOUT override → should FAIL. Then enable override checkbox → should WORK`.green);
        break;
      case 4:
        console.log(`  │  📝 TEST: Create return → At refund step, enter bank details (IFSC/Account) or UPI ID for COD refund`.green);
        break;
      case 5:
        console.log(`  │  📝 TEST: Return 2 items (shirt x2) → Then create 2nd return for trouser x1 → Then try over-return (shirt x5) → should FAIL`.green);
        break;
      case 6:
        console.log(`  │  📝 TEST: Exchange shirt (₹450) → shoes (₹800). Verify priceDifference=₹350. Block shipping until collected.`.green);
        break;
      case 7:
        console.log(`  │  📝 TEST: "Create Return" button should NOT appear on this order. API call should return error.`.green);
        break;
      case 8:
        console.log(`  │  📝 TEST: "Create Return" button should NOT appear. API call should return "cancelled" error.`.green);
        break;
      case 9:
        console.log(`  │  📝 TEST: Return discounted items. Verify refund = ₹450 (not ₹500) for shirt, ₹570 (not ₹600) for trouser.`.green);
        break;
    }
    console.log(`  └${'─'.repeat(76)}`);
  });

  console.log(`\n  🧪 ADDITIONAL EDGE CASE TESTS:`.magenta.bold);
  console.log(`     1. QC: Mark one item GOOD, one DAMAGED, one NOT_RECEIVED → verify stock buckets`.magenta);
  console.log(`     2. Cancel a return that has an exchange order (not shipped) → exchange should auto-cancel`.magenta);
  console.log(`     3. Try exchange to "${createdProducts[4].name}" (inactive) → should fail`.magenta);
  console.log(`     4. Try exchange to "${createdProducts[5].name}" (out of stock) → should fail`.magenta);
  console.log(`     5. After exchange order is delivered, try creating a return ON the exchange order`.magenta);
  console.log(`     6. Verify credit note has correct GST split (CGST for Haryana orders, IGST for Order #3)`.magenta);
  console.log(`     7. Reject a return → verify email and timeline`.magenta);
  console.log(`     8. Add admin notes at various stages → check timeline`.magenta);

  console.log(`\n  📊 Products for exchange testing:`.blue);
  console.log(`     Exchange TO (higher price): ${createdProducts[3].name} — Size 6/7/8 @ ₹800-850`.blue);
  console.log(`     Exchange TO (inactive):     ${createdProducts[4].name} — SHOULD FAIL`.blue);
  console.log(`     Exchange TO (out of stock):  ${createdProducts[5].name} — SHOULD FAIL`.blue);

  console.log(`\n${'━'.repeat(80)}`.cyan);
  console.log(`  ✅ SEED COMPLETE — ${createdOrders.length} orders ready for testing`.green.bold);
  console.log(`  🗑️  Run with --clean flag to remove all test data`.gray);
  console.log(`${'━'.repeat(80)}\n`.cyan);

  process.exit(0);
};

// ─────────────────────────────────────────────────────────────────────────
// Clean function — removes ALL test data by prefix
// ─────────────────────────────────────────────────────────────────────────
const clean = async (exitAfter = true) => {
  if (exitAfter) await connectDB();

  console.log('\n🗑️  Cleaning Return/Exchange test data...'.yellow);

  // Import ReturnRequest model
  let ReturnRequest;
  try {
    const mod = await import('../modules/returns/models/ReturnRequestModel.js');
    ReturnRequest = mod.default;
  } catch (e) {
    console.log('  ⚠️  ReturnRequest model not found, skipping return cleanup'.gray);
  }

  // Import StockMovement
  let StockMovement;
  try {
    const mod = await import('../modules/stock/models/StockMovementModel.js');
    StockMovement = mod.default;
  } catch (e) {
    console.log('  ⚠️  StockMovement model not found, skipping'.gray);
  }

  // Import BillQuotation (credit notes)
  let BillQuotation;
  try {
    const mod = await import('../modules/billing/models/QuotationModel.js');
    BillQuotation = mod.default;
  } catch (e) {
    console.log('  ⚠️  BillQuotation model not found, skipping'.gray);
  }

  // Find test user IDs
  const testUserIds = await User.find({ name: { $regex: `^${TEST_PREFIX}` } }).distinct('_id');
  const testProductIds = await Product.find({ SKU: { $regex: `^${TEST_PREFIX}` } }).distinct('_id');
  const testOrderIds = await Order.find({ name: { $regex: `^${TEST_PREFIX}` } }).distinct('_id');

  // Delete return requests linked to test orders
  if (ReturnRequest) {
    const retResult = await ReturnRequest.deleteMany({ order: { $in: testOrderIds } });
    console.log(`  Deleted ${retResult.deletedCount} return requests`.gray);
  }

  // Delete stock movements linked to test orders/products
  if (StockMovement) {
    const smResult = await StockMovement.deleteMany({
      $or: [
        { order: { $in: testOrderIds } },
        { product: { $in: testProductIds } },
      ],
    });
    console.log(`  Deleted ${smResult.deletedCount} stock movements`.gray);
  }

  // Delete credit notes created by test admin
  if (BillQuotation) {
    const cnResult = await BillQuotation.deleteMany({
      createdBy: { $in: testUserIds },
      reason: { $regex: /^Return RET-/ },
    });
    console.log(`  Deleted ${cnResult.deletedCount} credit notes`.gray);
  }

  // Delete test orders
  const orderResult = await Order.deleteMany({ name: { $regex: `^${TEST_PREFIX}` } });
  console.log(`  Deleted ${orderResult.deletedCount} orders`.gray);

  // Delete test products
  const productResult = await Product.deleteMany({ SKU: { $regex: `^${TEST_PREFIX}` } });
  console.log(`  Deleted ${productResult.deletedCount} products`.gray);

  // Delete test users
  const userResult = await User.deleteMany({ name: { $regex: `^${TEST_PREFIX}` } });
  console.log(`  Deleted ${userResult.deletedCount} users`.gray);

  console.log('  ✅ Cleanup complete\n'.green);

  if (exitAfter) process.exit(0);
};

// ─────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.includes('--clean')) {
  clean();
} else {
  seed();
}
