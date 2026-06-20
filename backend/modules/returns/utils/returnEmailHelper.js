import {
  processTemplate,
  sendEmailViaGmailAPI,
  formatPrice,
  formatDate,
} from '../../../utils/emailService.js';

/**
 * Status-to-template mapping.
 */
const TEMPLATE_MAP = {
  INITIATED: {
    template: 'returnInitiatedEmail.html',
    subject: (r) => `Return Request #${r.returnId} Created`,
  },
  APPROVED: {
    template: 'returnApprovedEmail.html',
    subject: (r) => `Return Request #${r.returnId} Approved`,
  },
  PICKUP_SCHEDULED: {
    template: 'returnPickupScheduledEmail.html',
    subject: (r) => `Pickup Scheduled for Return #${r.returnId}`,
  },
  REFUND_INITIATED: {
    template: 'returnRefundInitiatedEmail.html',
    subject: (r) => `Refund Initiated - #${r.returnId}`,
  },
  COMPLETED: {
    template: 'returnCompletedEmail.html',
    subject: (r) => `Refund Processed - #${r.returnId}`,
  },
  EXCHANGE_SHIPPED: {
    template: 'exchangeShippedEmail.html',
    subject: (r) =>
      `${r.type === 'REPLACEMENT' ? 'Replacement' : 'Exchange'} Order Shipped - #${r.returnId}`,
  },
  REPLACEMENT_SHIPPED: {
    template: 'exchangeShippedEmail.html',
    subject: (r) => `Replacement Order Shipped - #${r.returnId}`,
  },
  REJECTED: {
    template: 'returnRejectedEmail.html',
    subject: (r) => `Return Request #${r.returnId} Update`,
  },
  CANCELLED: {
    template: 'returnCancelledEmail.html',
    subject: (r) => `Return Request #${r.returnId} Cancelled`,
  },
  PICKUP_FAILED: {
    template: 'returnPickupFailedEmail.html',
    subject: (r) => `Pickup Attempt Failed - #${r.returnId}`,
  },
};

/**
 * Build common email data from a return request.
 */
const buildEmailData = (returnRequest) => {
  const items = returnRequest.items.map((item) => ({
    name: item.productName,
    size: item.size,
    qty: item.returnQty,
    price: formatPrice(item.price),
    refundAmount: formatPrice(item.refundAmount),
  }));

  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.size}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.qty}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">&#8377;${item.price}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">&#8377;${item.refundAmount}</td>
        </tr>`
    )
    .join('');

  return {
    returnId: returnRequest.returnId,
    orderId: returnRequest.orderId,
    customerName: returnRequest.customerName,
    type: returnRequest.type,
    reason: returnRequest.reason.replace(/_/g, ' '),
    reasonDetails: returnRequest.reasonDetails || '',
    refundAmount: formatPrice(returnRequest.refundAmount || 0),
    // Shipping is never refunded on returns; kept for template compatibility.
    shippingRefundAmount: formatPrice(0),
    totalRefund: formatPrice(returnRequest.refundAmount || 0),
    exchangeOrderNumber: returnRequest.exchangeOrderNumber || '',
    creditNoteNumber: returnRequest.creditNoteNumber || '',
    priceDifference: formatPrice(
      Math.abs(returnRequest.priceDifference || 0)
    ),
    itemsHtml,
    itemCount: items.length,
    createdDate: formatDate(returnRequest.createdAt),
    pickupDate: returnRequest.reverseShipping?.pickupScheduledDate
      ? formatDate(returnRequest.reverseShipping.pickupScheduledDate)
      : '',
    awbCode: returnRequest.reverseShipping?.awbCode || '',
    courierName: returnRequest.reverseShipping?.courierName || '',
    supportEmail:
      process.env.SUPPORT_EMAIL || 'help@allschooluniform.com',
    supportPhone: process.env.SUPPORT_PHONE || '+919654264262',
    frontendUrl: process.env.NEXTJS_URL || process.env.FRONTEND_URL || '',
  };
};

/**
 * Send a return lifecycle email to the customer.
 * Non-blocking — errors are logged but not thrown.
 *
 * @param {Object} returnRequest - Mongoose ReturnRequest document
 * @param {string} statusTrigger - The status that triggered this email
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const sendReturnEmail = async (returnRequest, statusTrigger) => {
  try {
    const mapping = TEMPLATE_MAP[statusTrigger];
    if (!mapping) {
      // Intentionally silent states (IN_TRANSIT, RECEIVED, QC_IN_PROGRESS,
      // QC_COMPLETED) have no customer email — these are internal-progress
      // states. Not an error; logged for traceability only.
      console.log(
        `[ReturnEmail] No customer email for status (intentional): ${statusTrigger}`
      );
      return { success: false, error: 'No template for status' };
    }

    const toEmail = returnRequest.customerEmail;
    if (!toEmail) {
      console.log(
        `[ReturnEmail] No customer email for return ${returnRequest.returnId}`
      );
      return { success: false, error: 'No customer email' };
    }

    const data = buildEmailData(returnRequest);
    const htmlContent = await processTemplate(mapping.template, data);
    const subject = mapping.subject(returnRequest);

    await sendEmailViaGmailAPI(toEmail, subject, htmlContent);

    console.log(
      `[ReturnEmail] ${statusTrigger} email sent to ${toEmail} for ${returnRequest.returnId}`
    );
    return { success: true, email: toEmail };
  } catch (error) {
    console.error(
      `[ReturnEmail] Failed to send ${statusTrigger} email for ${returnRequest.returnId}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

export default { sendReturnEmail };
