/**
 * Test script to send dummy emails for all order templates
 * Run with: node scripts/testEmails.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent asu directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

import {
    sendOrderConfirmationEmail,
    sendOrderShippedEmail,
    sendOutForDeliveryEmail,
    sendOrderDeliveredEmail,
    sendOrderCancelledEmail
} from '../utils/emailService.js';

// Dummy order data that mimics real order structure
const dummyOrder = {
    _id: '507f1f77bcf86cd799439011',
    orderId: 'ASU-TEST-2026',
    createdAt: new Date().toISOString(),
    deliveredAt: new Date().toISOString(),
    orderStatus: 'confirmed',
    isPaid: true,
    paymentMethod: 'Razorpay',
    paymentResult: {
        razorpay_payment_id: 'pay_test_1234567890'
    },
    orderItems: [
        {
            _id: '1',
            name: 'School Uniform Shirt - White Cotton',
            image: 'https://allschooluniform.com/uploads/products/default-shirt.jpg',
            price: 450,
            qty: 2,
            size: '32',
            disc: 10,
            brand: 'ASU Premium',
            schoolName: 'Delhi Public School'
        },
        {
            _id: '2',
            name: 'School Trousers - Navy Blue',
            image: 'https://allschooluniform.com/uploads/products/default-trouser.jpg',
            price: 550,
            qty: 1,
            size: '30',
            disc: 0,
            brand: 'ASU Standard'
        }
    ],
    shippingAddress: {
        fullName: 'Devansh Test',
        address: '123 Test Street, Sector 45',
        city: 'Noida',
        state: 'Uttar Pradesh',
        postalCode: '201301',
        country: 'India',
        phone: '+91 9876543210',
        email: 'devansh@allschooluniform.com'
    },
    shippingPrice: 0,
    taxPrice: 0,
    totalPrice: 1360,
    itemsPrice: 1360,
    name: 'Devansh Test',
    phone: '+91 9876543210'
};

const dummyUser = {
    _id: 'user123',
    name: 'Devansh',
    email: 'devansh@allschooluniform.com',
    phone: '+91 9876543210'
};

const trackingInfo = {
    trackingNumber: 'DEL1234567890',
    courierName: 'Delhivery'
};

async function sendAllTestEmails() {
    console.log('🚀 Starting test email sending...\n');
    console.log(`📧 Sending to: ${dummyUser.email}\n`);

    const results = [];

    // 1. Order Confirmation
    console.log('1️⃣ Sending Order Confirmation Email...');
    try {
        const result1 = await sendOrderConfirmationEmail(dummyOrder, dummyUser);
        results.push({ template: 'Order Confirmation', ...result1 });
        console.log(result1.success ? '   ✅ Sent!' : `   ❌ Failed: ${result1.error}`);
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        results.push({ template: 'Order Confirmation', success: false, error: err.message });
    }

    // Wait 2 seconds between emails to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000));

    // 2. Order Shipped
    console.log('2️⃣ Sending Order Shipped Email...');
    try {
        const result2 = await sendOrderShippedEmail(dummyOrder, dummyUser, trackingInfo);
        results.push({ template: 'Order Shipped', ...result2 });
        console.log(result2.success ? '   ✅ Sent!' : `   ❌ Failed: ${result2.error}`);
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        results.push({ template: 'Order Shipped', success: false, error: err.message });
    }

    await new Promise(r => setTimeout(r, 2000));

    // 3. Out for Delivery
    console.log('3️⃣ Sending Out for Delivery Email...');
    try {
        const result3 = await sendOutForDeliveryEmail(dummyOrder, dummyUser, trackingInfo);
        results.push({ template: 'Out for Delivery', ...result3 });
        console.log(result3.success ? '   ✅ Sent!' : `   ❌ Failed: ${result3.error}`);
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        results.push({ template: 'Out for Delivery', success: false, error: err.message });
    }

    await new Promise(r => setTimeout(r, 2000));

    // 4. Order Delivered
    console.log('4️⃣ Sending Order Delivered Email...');
    try {
        const result4 = await sendOrderDeliveredEmail(dummyOrder, dummyUser);
        results.push({ template: 'Order Delivered', ...result4 });
        console.log(result4.success ? '   ✅ Sent!' : `   ❌ Failed: ${result4.error}`);
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        results.push({ template: 'Order Delivered', success: false, error: err.message });
    }

    await new Promise(r => setTimeout(r, 2000));

    // 5. Order Cancelled
    console.log('5️⃣ Sending Order Cancelled Email...');
    try {
        const result5 = await sendOrderCancelledEmail(dummyOrder, dummyUser, 'testing purposes');
        results.push({ template: 'Order Cancelled', ...result5 });
        console.log(result5.success ? '   ✅ Sent!' : `   ❌ Failed: ${result5.error}`);
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        results.push({ template: 'Order Cancelled', success: false, error: err.message });
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log('─'.repeat(50));
    const successCount = results.filter(r => r.success).length;
    results.forEach(r => {
        console.log(`${r.success ? '✅' : '❌'} ${r.template}`);
    });
    console.log('─'.repeat(50));
    console.log(`Total: ${successCount}/${results.length} emails sent successfully`);

    if (successCount === results.length) {
        console.log('\n🎉 All test emails sent! Check your inbox.');
    } else {
        console.log('\n⚠️ Some emails failed. Check the errors above.');
    }
}

sendAllTestEmails().catch(console.error);
