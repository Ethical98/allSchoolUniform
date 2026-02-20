/**
 * Script to send delay notification emails to customers with orders
 * in "Received" or "Processed" status.
 *
 * Run with: node scripts/sendDelayNotification.js
 *
 * Options:
 *   --dry-run    Preview which customers would be emailed without actually sending
 *
 * Example:
 *   node scripts/sendDelayNotification.js --dry-run   # Preview first
 *   node scripts/sendDelayNotification.js              # Send for real
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent asu directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { google } from 'googleapis';
import fs from 'fs/promises';
import Order from '../models/OrderModel.js';
import User from '../models/UserModel.js';
import connectDB from '../config/db.js';
import colors from 'colors';

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Format date to readable format
 */
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * Send email via Gmail API
 */
const sendEmailViaGmailAPI = async (toEmail, subject, htmlContent) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const fromEmail = process.env.GMAIL_USER;

    const encodedSubject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

    const email = [
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `From: "All School Uniform" <${fromEmail}>`,
        `To: ${toEmail}`,
        `Bcc: akash@allschooluniform.com`,
        `Subject: ${encodedSubject}`,
        '',
        htmlContent,
    ].join('\n');

    const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedEmail },
    });
};

/**
 * Process template with data
 */
const processTemplate = async (data) => {
    const templatePath = path.join(__dirname, '../templates/orderDelayNotificationEmail.html');
    let htmlTemplate = await fs.readFile(templatePath, 'utf-8');

    // Replace all placeholders
    Object.keys(data).forEach((key) => {
        const value = data[key];
        if (value !== null && value !== undefined) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            htmlTemplate = htmlTemplate.replace(regex, value);
        }
    });

    return htmlTemplate;
};

/**
 * Main function
 */
async function sendDelayNotifications() {
    console.log('━'.repeat(60));
    console.log(DRY_RUN ? '🔍 DRY RUN MODE — No emails will be sent' : '🚀 LIVE MODE — Emails will be sent');
    console.log('━'.repeat(60));
    console.log('');

    try {
        // Connect to MongoDB using the project's config
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
            orderStatus: {
                $not: /^(Delivered|Canceled|Out For Delivery):/i,
            },
        }).populate('user', 'name email phone');

        console.log(`📦 Found ${orders.length} orders pending delivery\n`);

        if (orders.length === 0) {
            console.log('No orders to notify. Exiting.');
            await mongoose.connection.close();
            process.exit(0);
        }

        // Group orders by user email to avoid sending duplicate emails
        // (some customers may have multiple orders)
        const customerMap = new Map();

        for (const order of orders) {
            const user = order.user;
            if (!user || !user.email) {
                console.log(`⚠️  Skipping order ${order.orderId} — no user email found`);
                continue;
            }

            const email = user.email;
            if (!customerMap.has(email)) {
                customerMap.set(email, {
                    user,
                    orders: [],
                });
            }
            customerMap.get(email).orders.push(order);
        }

        console.log(`👤 ${customerMap.size} unique customers to notify\n`);
        console.log('─'.repeat(60));

        let successCount = 0;
        let failCount = 0;
        let index = 0;

        for (const [email, { user, orders: customerOrders }] of customerMap) {
            index++;

            // Send one email per order (so each customer gets specific order references)
            for (const order of customerOrders) {
                const orderNumber = order.orderId || order._id.toString();

                console.log(`[${index}/${customerMap.size}] ${user.name} (${email}) — Order: ${orderNumber}`);

                if (DRY_RUN) {
                    console.log(`   🔍 [DRY RUN] Would send delay notification email\n`);
                    successCount++;
                    continue;
                }

                try {
                    const websiteUrl = process.env.FRONTEND_URL || 'https://allschooluniform.com';

                    const emailData = {
                        orderNumber,
                        orderDate: formatDate(order.createdAt),
                        customerName: order.name || user.name,
                        customerEmail: email,
                        supportEmail: process.env.SUPPORT_EMAIL || 'help@allschooluniform.com',
                        trackOrderUrl: `${websiteUrl}/orders/${order._id}`,
                        websiteUrl,
                        year: new Date().getFullYear(),
                    };

                    const htmlContent = await processTemplate(emailData);

                    await sendEmailViaGmailAPI(
                        email,
                        `Important Update Regarding Your Order #${orderNumber}`,
                        htmlContent
                    );

                    console.log(`   ✅ Email sent successfully\n`);
                    successCount++;

                    // Wait 1.5 seconds between emails to avoid rate limiting
                    await new Promise((r) => setTimeout(r, 1500));
                } catch (err) {
                    console.log(`   ❌ Failed: ${err.message}\n`);
                    failCount++;
                }
            }
        }

        // Summary
        console.log('─'.repeat(60));
        console.log('\n📊 Summary:');
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Failed: ${failCount}`);
        console.log(`   📦 Total orders: ${orders.length}`);
        console.log(`   👤 Unique customers: ${customerMap.size}`);

        if (DRY_RUN) {
            console.log('\n🔍 This was a DRY RUN. No emails were actually sent.');
            console.log('   Run without --dry-run to send emails for real.');
        } else if (failCount === 0) {
            console.log('\n🎉 All notification emails sent successfully!');
        } else {
            console.log(`\n⚠️  ${failCount} email(s) failed. Check errors above.`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Script failed:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

sendDelayNotifications();
