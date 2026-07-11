/**
 * Test script to send delay notification email to a test address.
 * Run with: node scripts/testDelayEmail.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { google } from 'googleapis';
import fs from 'fs/promises';

const TEST_EMAIL = 'devanshgupta54@gmail.com';

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

async function sendTestDelayEmail() {
    console.log('🚀 Sending test delay notification email...');
    console.log(`📧 To: ${TEST_EMAIL}\n`);

    try {
        // Read template
        const templatePath = path.join(__dirname, '../templates/orderDelayNotificationEmail.html');
        let htmlTemplate = await fs.readFile(templatePath, 'utf-8');

        const websiteUrl = process.env.FRONTEND_URL || 'https://allschooluniform.com';

        const emailData = {
            orderNumber: 'ASU202602-TEST001',
            orderDate: formatDate(new Date()),
            customerName: 'Devansh',
            customerEmail: TEST_EMAIL,
            supportEmail: process.env.SUPPORT_EMAIL || 'help@allschooluniform.com',
            trackOrderUrl: `${websiteUrl}/orders/test123`,
            websiteUrl,
            year: new Date().getFullYear(),
        };

        // Replace placeholders
        Object.keys(emailData).forEach((key) => {
            const value = emailData[key];
            if (value !== null && value !== undefined) {
                const regex = new RegExp(`{{${key}}}`, 'g');
                htmlTemplate = htmlTemplate.replace(regex, value);
            }
        });

        // Setup Gmail API
        const oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const fromEmail = process.env.GMAIL_USER;

        const subject = `Important Update Regarding Your Order #ASU202602-TEST001`;
        const encodedSubject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

        const email = [
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `From: "All School Uniform" <${fromEmail}>`,
            `To: ${TEST_EMAIL}`,
            `Subject: ${encodedSubject}`,
            '',
            htmlTemplate,
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

        console.log(`✅ Test email sent successfully to ${TEST_EMAIL}`);
        console.log('📬 Check your inbox!');
    } catch (error) {
        console.error('❌ Failed:', error.message);
        if (error.response) {
            console.error('API response:', error.response.data);
        }
    }
}

sendTestDelayEmail();
