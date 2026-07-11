import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent asu directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Order from '../models/OrderModel.js';
import User from '../models/UserModel.js';
import connectDB from '../config/db.js';
import colors from 'colors';

async function exportDelayedOrders() {
    try {
        await connectDB();
        console.log('✅ MongoDB Connected\n');

        const orders = await Order.find({
            'tracking.isDelivered': false,
            'tracking.isCanceled': false,
            'tracking.isOutForDelivery': false,
            createdAt: {
                $gte: new Date('2026-01-01T00:00:00.000Z'),
                $lt: new Date('2027-01-01T00:00:00.000Z')
            },
            // Also ensure we don't accidentally fetch completed/OTF orders if tracking object is missing/incomplete
            orderStatus: {
                $not: /^(Delivered|Canceled|Out For Delivery):/i
            }
        }).populate('user', 'name email phone');

        console.log(`📦 Found ${orders.length} orders in Received/Processed state\n`);

        const csvHeader = 'Order ID,Order Date,Status,Customer Name,Email,Phone,Total Price\n';
        let csvContent = csvHeader;

        for (const order of orders) {
            const user = order.user || {};
            const orderNumber = order.orderId || order._id.toString();
            const date = new Date(order.createdAt).toISOString().split('T')[0];
            const statusMatch = order.orderStatus ? order.orderStatus.split(':')[0] : 'Unknown';
            const status = statusMatch;
            const name = (order.name || user.name || '').replace(/,/g, '');
            const email = (user.email || '').replace(/,/g, '');
            const phone = (order.phone || user.phone || '').replace(/,/g, '');
            const price = order.totalPrice || 0;

            csvContent += `${orderNumber},${date},${status},${name},${email},${phone},${price}\n`;
        }

        const outputPath = path.join(__dirname, '../../delayed_orders.csv');
        fs.writeFileSync(outputPath, csvContent);

        console.log(`✅ Successfully exported to: ${outputPath}`);
        console.log('You can open this file in Excel or Numbers.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}

exportDelayedOrders();
