// Default tax configuration
export const TAX_DEFAULTS = {
  HSN_CODE: '6203',
  TAX_RATE: 5,
  STANDARD_TAX_RATES: [0, 5, 12, 18, 28],
};

/**
 * Calculate tax for a single line item.
 * Prices are TAX-INCLUSIVE (MRP). Tax is extracted via reverse calculation.
 */
export const calculateLineTotal = (qty, unitPrice, discountPercent, taxRate, billType = 'CGST') => {
  const quantity = Number(qty) || 0;
  const price = Number(unitPrice) || 0;
  const discount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const rate = Math.max(0, Number(taxRate) || 0);
  const resolvedBillType = billType === 'IGST' ? 'IGST' : 'CGST';

  const grossAmount = quantity * price;
  const discountAmount = grossAmount * (discount / 100);
  const amountAfterDiscount = grossAmount - discountAmount;

  // Reverse-calculate: extract tax from the inclusive amount
  const taxableAmount = rate > 0 ? amountAfterDiscount / (1 + rate / 100) : amountAfterDiscount;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (resolvedBillType === 'CGST') {
    cgst = taxableAmount * (rate / 2 / 100);
    sgst = taxableAmount * (rate / 2 / 100);
  } else {
    igst = taxableAmount * (rate / 100);
  }

  // totalAmount = amountAfterDiscount (price already includes tax)
  const totalAmount = amountAfterDiscount;

  return {
    grossAmount: round2(grossAmount),
    discountAmount: round2(discountAmount),
    taxableAmount: round2(taxableAmount),
    cgst: round2(cgst),
    sgst: round2(sgst),
    igst: round2(igst),
    totalTax: round2(cgst + sgst + igst),
    totalAmount: round2(totalAmount),
  };
};

/**
 * Calculate totals for an array of flat items.
 * Each item: { quantity, unitPrice, discount, taxRate }
 */
export const calculateDocumentTotals = (items, billType = 'CGST') => {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTaxableAmount = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  for (const item of items) {
    const line = calculateLineTotal(
      item.quantity,
      item.unitPrice,
      item.discount,
      item.taxRate,
      billType
    );
    subtotal += line.grossAmount;
    totalDiscount += line.discountAmount;
    totalTaxableAmount += line.taxableAmount;
    totalCGST += line.cgst;
    totalSGST += line.sgst;
    totalIGST += line.igst;
  }

  const totalTax = totalCGST + totalSGST + totalIGST;
  // Grand total = subtotal - discount (since prices are tax-inclusive)
  const grandTotalRaw = subtotal - totalDiscount;
  const grandTotal = Math.round(grandTotalRaw); // Round to nearest rupee (standard Indian billing)
  const roundOff = round2(grandTotal - grandTotalRaw);

  return {
    subtotal: round2(subtotal),
    totalDiscount: round2(totalDiscount),
    totalTaxableAmount: round2(totalTaxableAmount),
    totalCGST: round2(totalCGST),
    totalSGST: round2(totalSGST),
    totalIGST: round2(totalIGST),
    totalTax: round2(totalTax),
    grandTotal,
    roundOff,
  };
};

/**
 * Check if a tax rate is one of the standard GST slabs.
 */
export const isStandardTaxRate = (rate) => TAX_DEFAULTS.STANDARD_TAX_RATES.includes(Number(rate));

/**
 * Validate GSTIN format (15-character alphanumeric).
 */
export const validateGSTIN = (gstin) => {
  if (!gstin) return true;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.toUpperCase());
};

/**
 * Validate PAN format (10-character).
 */
export const validatePAN = (pan) => {
  if (!pan) return true;
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
};

/**
 * Validate Indian pincode (6 digits).
 */
export const validatePincode = (pincode) => {
  if (!pincode) return true;
  return /^[1-9][0-9]{5}$/.test(pincode);
};

function round2(num) {
  return Math.round(num * 100) / 100;
}
