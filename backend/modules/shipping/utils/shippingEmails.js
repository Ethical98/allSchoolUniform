import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Send email via Gmail API (same pattern as emailService.js)
 */
const sendEmail = async (to, subject, htmlBody) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const message = [
      `From: All School Uniform <${process.env.GMAIL_USER || 'noreply@allschooluniform.com'}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlBody,
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });

    console.log(`[Shipping Email] Sent: ${subject}`);
  } catch (error) {
    console.error('[Shipping Email] Failed:', error.message);
  }
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.GMAIL_USER || 'noreply@allschooluniform.com';

/**
 * Send NDR alert email to admin
 */
export const sendNDRAlertEmail = async (order, ndrReason) => {
  const subject = `NDR Alert - Order ${order.orderId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Non-Delivery Report (NDR)</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; font-weight: bold;">Order ID:</td><td style="padding: 8px;">${order.orderId}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Customer:</td><td style="padding: 8px;">${order.name}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Phone:</td><td style="padding: 8px;">${order.phone}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">AWB:</td><td style="padding: 8px;">${order.shipping?.awbCode || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Courier:</td><td style="padding: 8px;">${order.shipping?.courierName || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">NDR Reason:</td><td style="padding: 8px; color: #dc2626;">${ndrReason}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">NDR Count:</td><td style="padding: 8px;">${order.shipping?.ndr?.ndrCount || 1}</td></tr>
      </table>
      <p style="margin-top: 16px; color: #6b7280;">Please take action from the admin panel: Reattempt delivery or initiate RTO.</p>
    </div>
  `;

  await sendEmail(ADMIN_EMAIL, subject, html);
};

/**
 * Send RTO alert email to admin
 */
export const sendRTOAlertEmail = async (order) => {
  const subject = `RTO Initiated - Order ${order.orderId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">Return To Origin (RTO) Initiated</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; font-weight: bold;">Order ID:</td><td style="padding: 8px;">${order.orderId}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Customer:</td><td style="padding: 8px;">${order.name}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">AWB:</td><td style="padding: 8px;">${order.shipping?.awbCode || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Courier:</td><td style="padding: 8px;">${order.shipping?.courierName || 'N/A'}</td></tr>
      </table>
      <p style="margin-top: 16px; color: #6b7280;">The package is being returned. Stock will be restored automatically when RTO is delivered.</p>
    </div>
  `;

  await sendEmail(ADMIN_EMAIL, subject, html);
};

/**
 * Send weight discrepancy alert email to admin
 */
export const sendWeightDisputeEmail = async (order, reportedWeight) => {
  const subject = `Weight Discrepancy - Order ${order.orderId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">Weight Discrepancy Detected</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; font-weight: bold;">Order ID:</td><td style="padding: 8px;">${order.orderId}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">AWB:</td><td style="padding: 8px;">${order.shipping?.awbCode || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Entered Weight:</td><td style="padding: 8px;">${order.shipping?.weight || 'N/A'} kg</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Reported Weight:</td><td style="padding: 8px; color: #dc2626;">${reportedWeight} kg</td></tr>
      </table>
      <p style="margin-top: 16px; color: #6b7280;">Please review the weight discrepancy. Shipping charges may be revised.</p>
    </div>
  `;

  await sendEmail(ADMIN_EMAIL, subject, html);
};

/**
 * Send stuck shipment alert email to admin
 */
export const sendStuckShipmentEmail = async (orders) => {
  const subject = `Stuck Shipments Alert - ${orders.length} shipment(s)`;
  const rows = orders
    .map(
      (o) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${o.orderId}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${o.shipping?.awbCode || 'N/A'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${o.shipping?.courierName || 'N/A'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${o.shipping?.status || 'N/A'}</td>
    </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Stuck Shipments - No Update in 48+ Hours</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 8px; text-align: left;">Order ID</th>
            <th style="padding: 8px; text-align: left;">AWB</th>
            <th style="padding: 8px; text-align: left;">Courier</th>
            <th style="padding: 8px; text-align: left;">Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top: 16px; color: #6b7280;">Please refresh tracking or contact the courier partner.</p>
    </div>
  `;

  await sendEmail(ADMIN_EMAIL, subject, html);
};
