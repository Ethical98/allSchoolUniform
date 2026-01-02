import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Format price to Indian currency format
 */
const formatPrice = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

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
 * Calculate estimated delivery date
 */
const calculateDeliveryDate = () => {
  const today = new Date();
  const minDays = 5;
  const maxDays = 7;
  
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + minDays);
  
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDays);
  
  return `${minDate.toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })}-${maxDate.toLocaleDateString('en-IN', { day: 'numeric', year: 'numeric' })}`;
};

/**
 * Generate order items HTML
 */
const generateOrderItemsHTML = (orderItems) => {
  return orderItems.map(item => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
      <tr>
        <td width="80" style="padding-right: 15px;">
          <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; display: block; border: 1px solid #e5e7eb;">
        </td>
        <td style="vertical-align: top;">
          <h4 style="margin: 0 0 5px; color: #111827; font-size: 16px; font-weight: 600;">${item.name}</h4>
          <p style="margin: 0 0 5px; color: #6b7280; font-size: 14px;">Size: ${item.size}${item.schoolName ? `, School: ${item.schoolName}` : ''}</p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Quantity: ${item.qty}</p>
        </td>
        <td align="right" style="vertical-align: top;">
          <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">₹${formatPrice(item.price * item.qty)}</p>
        </td>
      </tr>
    </table>
  `).join('');
};

/**
 * Send order confirmation email using Gmail API (bypasses SMTP port restrictions)
 */
export const sendOrderConfirmationEmail = async (order, user) => {
  try {
    console.log(`[Email] Preparing order confirmation for ${user.email}...`);

    // Setup OAuth2 client for Gmail API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Read email template
    const templatePath = path.join(__dirname, '../templates/orderConfirmationEmail.html');
    let htmlTemplate = await fs.readFile(templatePath, 'utf-8');

    // Calculate discount if any
    const totalDiscount = order.orderItems.reduce((acc, item) => {
      const discAmount = (item.price * item.qty * (item.disc || 0)) / 100;
      return acc + discAmount;
    }, 0);

    // Prepare email data
    const emailData = {
      orderNumber: order.orderId || order._id.toString(),
      orderDate: formatDate(order.createdAt),
      estimatedDelivery: calculateDeliveryDate(),
      itemsHTML: generateOrderItemsHTML(order.orderItems),
      subtotal: formatPrice(order.itemsPrice || 0),
      shipping: order.shippingPrice === 0 ? 'FREE' : formatPrice(order.shippingPrice),
      discount: totalDiscount > 0 ? formatPrice(totalDiscount) : null,
      tax: formatPrice(order.taxPrice || 0),
      total: formatPrice(order.totalPrice),
      
      // Shipping Address
      shippingName: order.name || user.name,
      shippingAddress: order.shippingAddress.address,
      shippingCity: order.shippingAddress.city,
      shippingState: order.shippingAddress.state,
      shippingPostalCode: order.shippingAddress.postalCode,
      shippingCountry: order.shippingAddress.country,
      shippingPhone: order.phone || user.phone,
      
      // Billing Address (same as shipping for now)
      billingName: order.name || user.name,
      billingAddress: order.shippingAddress.address,
      billingCity: order.shippingAddress.city,
      billingState: order.shippingAddress.state,
      billingPostalCode: order.shippingAddress.postalCode,
      billingCountry: order.shippingAddress.country,
      
      // Payment
      paymentMethod: order.paymentMethod === 'Razorpay' ? 'Online Payment' : order.paymentMethod,
      last4: order.paymentResult?.id ? order.paymentResult.id.slice(-4) : null,
      
      // Links
      trackOrderUrl: `${process.env.FRONTEND_URL || 'https://allschooluniform.com'}/orders/${order._id}`,
      websiteUrl: process.env.FRONTEND_URL || 'https://allschooluniform.com',
      faqUrl: `${process.env.FRONTEND_URL || 'https://allschooluniform.com'}/faq`,
      privacyPolicyUrl: `${process.env.FRONTEND_URL || 'https://allschooluniform.com'}/privacy`,
      termsUrl: `${process.env.FRONTEND_URL || 'https://allschooluniform.com'}/terms`,
      
      // Contact
      supportEmail: process.env.SUPPORT_EMAIL || 'support@allschooluniform.com',
      supportPhone: process.env.SUPPORT_PHONE || '+91 80 1234 5678',
      senderEmail: process.env.GMAIL_USER || 'noreply@allschooluniform.com',
      customerEmail: user.email,
      
      // Misc
      year: new Date().getFullYear(),
    };

    // Replace all placeholders in template
    Object.keys(emailData).forEach(key => {
      const value = emailData[key];
      if (value !== null && value !== undefined) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlTemplate = htmlTemplate.replace(regex, value);
      }
    });

    // Handle conditional discount section
    if (emailData.discount) {
      htmlTemplate = htmlTemplate.replace(/{{#if discount}}/g, '');
      htmlTemplate = htmlTemplate.replace(/{{\/if}}/g, '');
    } else {
      // Remove discount row if no discount
      htmlTemplate = htmlTemplate.replace(/{{#if discount}}[\s\S]*?{{\/if}}/g, '');
    }

    // Handle last4 digits display
    if (emailData.last4) {
      htmlTemplate = htmlTemplate.replace(/{{#if last4}}/g, '');
      htmlTemplate = htmlTemplate.replace(/{{\/if}}/g, '');
    } else {
      htmlTemplate = htmlTemplate.replace(/{{#if last4}}[\s\S]*?{{\/if}}/g, '');
    }

    // Handle items loop
    htmlTemplate = htmlTemplate.replace(/{{#each items}}[\s\S]*?{{\/each}}/g, emailData.itemsHTML);

    const fromEmail = process.env.GMAIL_USER;
    const subject = `Order Confirmation - ${emailData.orderNumber}`;

    // Create RFC 2822 formatted email
    const email = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `From: "All School Uniform" <${fromEmail}>`,
      `To: ${user.email}`,
      `Subject: ${subject}`,
      '',
      htmlTemplate
    ].join('\n');

    // Base64 URL-safe encode
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    console.log(`✅ Order confirmation email sent via Gmail API to ${user.email}`);
    return { success: true, email: user.email };
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error.message);
    if (error.response) {
      console.error('[Email] API response:', error.response.data);
    }
    // Don't throw error - we don't want to fail the order creation if email fails
    return { success: false, error: error.message };
  }
};

