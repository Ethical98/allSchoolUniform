import BillQuotation from '../../billing/models/QuotationModel.js';
import {
  generateDocumentNumber,
  calculateTotals,
} from '../../billing/utils/quotationUtils.js';
import { isItemRefundable, resolveQcQty } from '../pricing/returnPricing.js';

/**
 * Transform flat return items into nested billing format.
 * Matches the groupFlatItemsToNested pattern in quotationController.js.
 * @param {Array} returnItems
 * @param {boolean} fullRefund - when true, the credit note covers every item at
 *   its full requested quantity (mirrors computeReturnRefund's full-refund mode).
 */
const groupReturnItemsToNested = (returnItems, fullRefund = false) => {
  const grouped = {};

  for (const item of returnItems) {
    // Full refund covers every item at full requested qty. Otherwise skip items
    // that are not refundable (NOT_RECEIVED never arrived; UNSELLABLE written
    // off) so the credit note reflects the same items as the cash refund.
    // (Totals may differ by sub-rupee rounding: calculateTotals rounds
    // grandTotal to whole rupees, refundAmount is rounded to 2dp.)
    if (!fullRefund && !isItemRefundable(item)) continue;

    // Match the cash-refund quantity: full refund uses returnQty, otherwise the
    // QC-accepted quantity (resolveQcQty honors acceptedQty, falls back to
    // returnQty). Skip lines that resolve to zero accepted units.
    const quantity = fullRefund ? (item.returnQty || 0) : resolveQcQty(item);
    if (!quantity || quantity <= 0) continue;

    const variant = {
      size: item.size || '',
      quantity,
      unitPrice: item.price || 0, // Maps from `price` (order field name)
      discount: item.disc || 0, // Maps from `disc` (order field name)
      taxRate: item.tax || 0, // Maps from `tax` (order field name)
      hsnCode: '',
    };

    const key = String(item.product);
    if (!grouped[key]) {
      grouped[key] = {
        product: item.product,
        name: item.productName || '',
        sku: item.SKU || '',
        isCustomItem: false,
        variants: [],
      };
    }
    grouped[key].variants.push(variant);
  }

  return Object.values(grouped);
};

/**
 * Generate a GST-compliant credit note for a return request.
 *
 * Follows the exact same pattern as createCreditNote in quotationController.js:
 * 1. Build flat items → group to nested → calculateTotals → create BillQuotation
 *
 * @param {Object} returnRequest - Mongoose ReturnRequest document
 * @param {Object} adminUser - { _id } of admin
 * @returns {Object} The created credit note document
 */
export const generateReturnCreditNote = async (returnRequest, adminUser) => {
  // Guard: prevent duplicate credit note
  if (returnRequest.creditNote) {
    throw new Error(
      `Credit note already generated: ${returnRequest.creditNoteNumber}`
    );
  }

  // Find the original invoice linked to this order
  let invoice = null;
  if (returnRequest.invoiceNumber) {
    invoice = await BillQuotation.findOne({
      documentNumber: returnRequest.invoiceNumber,
      documentType: { $in: ['TAX_INVOICE', 'CASH_BILL'] },
    });
  }

  // Build nested items from return items (honor full-refund mode)
  const nestedItems = groupReturnItemsToNested(
    returnRequest.items,
    returnRequest.fullRefundOverride === true
  );

  if (nestedItems.length === 0) {
    throw new Error('No refundable items found for credit note generation');
  }

  // Generate document number and calculate totals
  const documentNumber = await generateDocumentNumber('CREDIT_NOTE');
  const totals = calculateTotals(nestedItems, returnRequest.billType);

  // Build credit note document
  const creditNoteData = {
    documentNumber,
    documentType: 'CREDIT_NOTE',
    status: 'DRAFT',
    linkedInvoice: invoice?._id || undefined,
    reason: `Return ${returnRequest.returnId}: ${returnRequest.reason}${returnRequest.reasonDetails ? ' - ' + returnRequest.reasonDetails : ''}`,
    items: totals.items,
    subtotal: totals.subtotal,
    totalDiscount: totals.totalDiscount,
    totalTaxableAmount: totals.totalTaxableAmount,
    totalCGST: totals.totalCGST,
    totalSGST: totals.totalSGST,
    totalIGST: totals.totalIGST,
    totalTax: totals.totalTax,
    grandTotal: totals.grandTotal,
    amountInWords: totals.amountInWords,
    roundOff: totals.roundOff,
    billType: returnRequest.billType,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  };

  // Shipping is never refunded on returns, so the credit note carries no
  // shipping charges (no grand-total adjustment).

  // Copy sender/buyer snapshots from original invoice if available
  if (invoice) {
    creditNoteData.sender = invoice.sender;
    creditNoteData.buyer = invoice.buyer;
    if (invoice.walkInCustomer) {
      creditNoteData.walkInCustomer = invoice.walkInCustomer;
    }
  }

  const creditNote = await BillQuotation.create(creditNoteData);

  // Update the return request with credit note reference
  returnRequest.creditNote = creditNote._id;
  returnRequest.creditNoteNumber = documentNumber;
  await returnRequest.save();

  return creditNote;
};

export default { generateReturnCreditNote };
