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
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
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
 * Calculate estimated delivery date (5-7 business days from today)
 */
const calculateDeliveryDate = () => {
  const today = new Date();
  const minDays = 2;
  const maxDays = 4;

  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + minDays);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDays);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  // If same month: "8-10 January 2026"
  if (minDate.getMonth() === maxDate.getMonth()) {
    return `${minDate.getDate()}-${maxDate.getDate()} ${monthNames[minDate.getMonth()]} ${minDate.getFullYear()}`;
  }
  
  // Different months: "30 January - 2 February 2026"
  return `${minDate.getDate()} ${monthNames[minDate.getMonth()]} - ${maxDate.getDate()} ${monthNames[maxDate.getMonth()]} ${maxDate.getFullYear()}`;
};

/**
 * Generate order items HTML
 */
const generateOrderItemsHTML = (orderItems) => {
  // Always use production URL for images so they load in email clients
  const imgBaseUrl = 'https://allschooluniform.com';
  
  return orderItems.map(item => {
    // Ensure image has full URL with production domain
    let imageUrl = item.image;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `${imgBaseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }
    
    // Encode URL to handle spaces and special characters properly
    if (imageUrl) {
      imageUrl = encodeURI(imageUrl);
    }
    // Fallback placeholder if no image
    if (!imageUrl) {
      imageUrl = 'https://img.icons8.com/ios-filled/80/cccccc/t-shirt.png';
    }
    
    return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
      <tr>
        <td width="80" style="padding-right: 15px;">
          <img src="${imageUrl}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 8px; display: block; border: 1px solid #e5e7eb;">
        </td>
        <td style="vertical-align: top;">
          <h4 style="margin: 0 0 5px; color: #111827; font-size: 16px; font-weight: 600;">${item.name}</h4>
          <p style="margin: 0 0 5px; color: #6b7280; font-size: 14px;">
            Size: ${item.size}
            ${item.brand ? ` • Brand: ${item.brand}` : ''}
          </p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Quantity: ${item.qty}</p>
        </td>
        <td align="right" style="vertical-align: top;">
          <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">₹${formatPrice(item.price * item.qty)}</p>
        </td>
      </tr>
    </table>
  `;
  }).join('');
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

    // Calculate MRP total (same as frontend OrderSummary)
    const mrpTotal = order.orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

    // Calculate subtotal (MRP - discount)
    const subtotalAmount = mrpTotal - totalDiscount;

    // Item count
    const itemCount = order.orderItems.reduce((sum, item) => sum + item.qty, 0);

    // Discount percentage
    const discountPercent = mrpTotal > 0 ? Math.round((totalDiscount / mrpTotal) * 100) : 0;

    // Prepare email data
    const emailData = {
      orderNumber: order.orderId || order._id.toString(),
      orderDate: formatDate(order.createdAt),
      estimatedDelivery: calculateDeliveryDate(),
      itemsHTML: generateOrderItemsHTML(order.orderItems),

      // Order Summary - matching frontend OrderSummary component
      mrpTotal: formatPrice(mrpTotal),
      itemCount: itemCount,
      itemCountPlural: itemCount > 1 ? 's' : '',
      discount: formatPrice(totalDiscount),
      discountPercent: discountPercent > 0 ? discountPercent : null,
      subtotal: formatPrice(subtotalAmount),
      shippingDisplay: order.shippingPrice === 0 ? 'FREE' : `₹${formatPrice(order.shippingPrice)}`,
      shippingColor: order.shippingPrice === 0 ? '#10b981' : '#111827',
      shippingWeight: order.shippingPrice === 0 ? '600' : '400',
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
      faqUrl: `${process.env.FRONTEND_URL || 'https://allschooluniform.com'}/policies`,
      privacyPolicyUrl: `${process.env.FRONTEND_URL || 'https://allschooluniform.com'}/policies/privacy`,
      termsUrl: `${process.env.FRONTEND_URL || 'https://allschooluniform.com'}/policies/terms`,

      // Contact
      supportEmail: process.env.SUPPORT_EMAIL || 'help@allschooluniform.com',
      supportPhone: process.env.SUPPORT_PHONE || '+919654264262',
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
      // Only remove the specific /if for discount, not all
    } else {
      // Remove discount row and savings box if no discount
      htmlTemplate = htmlTemplate.replace(/{{#if discount}}[\s\S]*?{{\/if}}/g, '');
    }

    // Handle discountPercent conditional
    if (emailData.discountPercent) {
      htmlTemplate = htmlTemplate.replace(/{{#if discountPercent}}/g, '');
    } else {
      htmlTemplate = htmlTemplate.replace(/{{#if discountPercent}}[\s\S]*?{{\/if}}/g, '');
    }

    // Handle last4 digits display (must be before /if cleanup)
    if (emailData.last4) {
      htmlTemplate = htmlTemplate.replace(/{{#if last4}}/g, '');
    } else {
      htmlTemplate = htmlTemplate.replace(/{{#if last4}}[\s\S]*?{{\/if}}/g, '');
    }

    // Clean up remaining /if tags
    htmlTemplate = htmlTemplate.replace(/{{\/if}}/g, '');

    // Handle items loop
    htmlTemplate = htmlTemplate.replace(/{{#each items}}[\s\S]*?{{\/each}}/g, emailData.itemsHTML);

    const fromEmail = process.env.GMAIL_USER;
    const adminEmail = process.env.ADMIN_EMAIL || 'akash@allschooluniform.com';
    const subject = `Order Confirmation - ${emailData.orderNumber}`;

    // Create RFC 2822 formatted email with BCC to admin
    const email = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `From: "All School Uniform" <${fromEmail}>`,
      `To: ${user.email}`,
      `Bcc: ${adminEmail}`,
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

/**
 * Helper function to send email via Gmail API
 */
const sendEmailViaGmailAPI = async (toEmail, subject, htmlContent) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const fromEmail = process.env.GMAIL_USER;


  const encodedSubject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

  const email = [
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `From: "All School Uniform" <${fromEmail}>`,
    `To: ${toEmail}`,
    `Subject: ${encodedSubject}`,
    '',
    htmlContent
  ].join('\n');

  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedEmail }
  });
};

/**
 * Process template with data and inject partials
 */
const processTemplate = async (templateName, data) => {
  const templatePath = path.join(__dirname, `../templates/${templateName}`);
  let htmlTemplate = await fs.readFile(templatePath, 'utf-8');

  // Load and inject partials
  const headerPath = path.join(__dirname, '../templates/partials/_header.html');
  const footerPath = path.join(__dirname, '../templates/partials/_footer.html');
  
  try {
    const headerHtml = await fs.readFile(headerPath, 'utf-8');
    const footerHtml = await fs.readFile(footerPath, 'utf-8');
    
    htmlTemplate = htmlTemplate.replace('{{> header}}', headerHtml);
    htmlTemplate = htmlTemplate.replace('{{> footer}}', footerHtml);
  } catch (err) {
    // Partials not found, continue without them (for backward compatibility)
    console.log('[Email] Partials not found, using full template');
  }

  // Replace all placeholders
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== null && value !== undefined) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlTemplate = htmlTemplate.replace(regex, value);
    }
  });

  // Handle conditionals
  const conditionals = ['trackingNumber', 'courierName', 'refundAmount', 'discount', 'discountPercent', 'last4'];
  conditionals.forEach(key => {
    if (data[key]) {
      htmlTemplate = htmlTemplate.replace(new RegExp(`{{#if ${key}}}`, 'g'), '');
    } else {
      htmlTemplate = htmlTemplate.replace(new RegExp(`{{#if ${key}}}[\\s\\S]*?{{\\/if}}`, 'g'), '');
    }
  });
  htmlTemplate = htmlTemplate.replace(/{{\/if}}/g, '');

  return htmlTemplate;
};

/**
 * Get common email data
 */
const getCommonEmailData = (order, user) => ({
  orderNumber: order.orderId || order._id.toString(),
  shippingName: order.name || user?.name,
  shippingAddress: order.shippingAddress?.address,
  shippingCity: order.shippingAddress?.city,
  shippingState: order.shippingAddress?.state,
  shippingPostalCode: order.shippingAddress?.postalCode,
  shippingCountry: order.shippingAddress?.country,
  shippingPhone: order.phone || user?.phone,
  trackOrderUrl: `${process.env.FRONTEND_URL || 'https://allschooluniform.com'}/orders/${order._id}`,
  websiteUrl: process.env.FRONTEND_URL || 'https://allschooluniform.com',
  privacyPolicyUrl: `${process.env.FRONTEND_URL || 'https://allschooluniform.com'}/policies/privacy`,
  termsUrl: `${process.env.FRONTEND_URL || 'https://allschooluniform.com'}/policies/terms`,
  faqUrl: `${process.env.FRONTEND_URL || 'https://allschooluniform.com'}/policies`,
  supportEmail: process.env.SUPPORT_EMAIL || 'help@allschooluniform.com',
  supportPhone: process.env.SUPPORT_PHONE || '+919654264262',
  customerEmail: user?.email || order.shippingAddress?.email,
  year: new Date().getFullYear(),
});

/**
 * Send order shipped email
 */
export const sendOrderShippedEmail = async (order, user, trackingInfo = {}) => {
  try {
    console.log(`[Email] Preparing shipped email for ${user?.email}...`);

    const emailData = {
      ...getCommonEmailData(order, user),
      emailTitle: 'Order Shipped - All School Uniform',
      shippedDate: formatDate(new Date()),
      estimatedDelivery: calculateDeliveryDate(),
      trackingNumber: trackingInfo.trackingNumber || null,
      courierName: trackingInfo.courierName || null,
      itemsHTML: generateOrderItemsHTML(order.orderItems),
    };

    const htmlContent = await processTemplate('orderShippedEmail.html', emailData);
    await sendEmailViaGmailAPI(user.email, `Your Order #${emailData.orderNumber} Has Been Shipped! 📦`, htmlContent);

    console.log(`✅ Order shipped email sent to ${user.email}`);
    return { success: true, email: user.email };
  } catch (error) {
    console.error('❌ Failed to send order shipped email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send out for delivery email
 */
export const sendOutForDeliveryEmail = async (order, user, trackingInfo = {}) => {
  try {
    console.log(`[Email] Preparing out for delivery email for ${user?.email}...`);

    const itemCount = order.orderItems.reduce((sum, item) => sum + item.qty, 0);

    const emailData = {
      ...getCommonEmailData(order, user),
      emailTitle: 'Out for Delivery - All School Uniform',
      itemCount: itemCount,
      trackingNumber: trackingInfo.trackingNumber || null,
    };

    const htmlContent = await processTemplate('orderOutForDeliveryEmail.html', emailData);
    await sendEmailViaGmailAPI(user.email, `Your Order #${emailData.orderNumber} is Out for Delivery! 🚛`, htmlContent);

    console.log(`✅ Out for delivery email sent to ${user.email}`);
    return { success: true, email: user.email };
  } catch (error) {
    console.error('❌ Failed to send out for delivery email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send order delivered email
 */
export const sendOrderDeliveredEmail = async (order, user) => {
  try {
    console.log(`[Email] Preparing delivered email for ${user?.email}...`);

    const emailData = {
      ...getCommonEmailData(order, user),
      emailTitle: 'Order Delivered - All School Uniform',
      deliveredDate: formatDate(order.deliveredAt || new Date()),
      total: formatPrice(order.totalPrice),
      itemsHTML: generateOrderItemsHTML(order.orderItems),

      invoiceUrl: `${process.env.FRONTEND_URL || 'https://allschooluniform.com'}/orders/${order._id}?invoice=true`,
      returnPolicyUrl: `${process.env.FRONTEND_URL || 'https://allschooluniform.com'}/policies/returns`,
    };

    const htmlContent = await processTemplate('orderDeliveredEmail.html', emailData);
    await sendEmailViaGmailAPI(user.email, `Your Order #${emailData.orderNumber} Has Been Delivered! 🎉`, htmlContent);

    console.log(`✅ Order delivered email sent to ${user.email}`);
    return { success: true, email: user.email };
  } catch (error) {
    console.error('❌ Failed to send order delivered email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send order cancelled email
 */
export const sendOrderCancelledEmail = async (order, user, cancellationReason = 'your request') => {
  try {
    console.log(`[Email] Preparing cancelled email for ${user?.email}...`);

    const emailData = {
      ...getCommonEmailData(order, user),
      emailTitle: 'Order Cancelled - All School Uniform',
      orderDate: formatDate(order.createdAt),
      cancelledDate: formatDate(new Date()),
      cancellationReason: cancellationReason,
      itemsHTML: generateOrderItemsHTML(order.orderItems),
      refundAmount: order.isPaid ? formatPrice(order.totalPrice) : null,
      refundMethod: order.paymentMethod === 'Razorpay' ? 'Original payment method' : 'Bank Transfer',
    };

    const htmlContent = await processTemplate('orderCancelledEmail.html', emailData);
    await sendEmailViaGmailAPI(user.email, `Order #${emailData.orderNumber} Cancelled`, htmlContent);

    console.log(`✅ Order cancelled email sent to ${user.email}`);
    return { success: true, email: user.email };
  } catch (error) {
    console.error('❌ Failed to send order cancelled email:', error.message);
    return { success: false, error: error.message };
  }
};
