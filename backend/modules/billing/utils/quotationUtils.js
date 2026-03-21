import QuotationCounter from '../models/QuotationCounterModel.js';

// Indian Financial Year starts in April (month index 3, 0-based)
const FY_START_MONTH = 3;

/**
 * Get financial year string from a date.
 * Indian FY runs April to March.
 * e.g., April 2025 - March 2026 => '2526'
 */
export const getFinancialYear = (date = new Date()) => {
  const month = date.getMonth(); // 0-indexed (0 = Jan)
  const year = date.getFullYear();

  let startYear, endYear;
  if (month >= FY_START_MONTH) {
    // April onwards
    startYear = year;
    endYear = year + 1;
  } else {
    // Jan-March belongs to previous FY
    startYear = year - 1;
    endYear = year;
  }

  return `${String(startYear).slice(-2)}${String(endYear).slice(-2)}`;
};

/**
 * Get document prefix from document type.
 */
const getPrefix = (documentType) => {
  const prefixes = {
    QUOTATION: 'QT',
    PROFORMA_INVOICE: 'PI',
    TAX_INVOICE: 'INV',
    CASH_BILL: 'CB',
    CREDIT_NOTE: 'CN',
    DEBIT_NOTE: 'DN',
  };
  return prefixes[documentType] || 'DOC';
};

/**
 * Generate a unique document number.
 * Format: PREFIX-FYYYYY-NNNNN (e.g., QT-2526-00001)
 * Uses atomic $inc for concurrency safety.
 */
export const generateDocumentNumber = async (documentType) => {
  const fy = getFinancialYear();
  const prefix = getPrefix(documentType);
  const counterId = `${prefix}_${fy}`;

  const counter = await QuotationCounter.findByIdAndUpdate(
    counterId,
    {
      $inc: { seq: 1 },
      $setOnInsert: { prefix, financialYear: fy },
    },
    { new: true, upsert: true }
  );

  const seq = String(counter.seq).padStart(5, '0');
  return `${prefix}-${fy}-${seq}`;
};

/**
 * Calculate totals for a list of items.
 * Each item has variants with quantity, unitPrice, discount, taxRate.
 * Prices are TAX-INCLUSIVE (MRP). Tax is extracted via reverse calculation.
 * billType determines CGST+SGST vs IGST.
 */
export const calculateTotals = (items, billType = 'CGST') => {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTaxableAmount = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const processedItems = items.map((item) => {
    let itemTotal = 0;

    const processedVariants = (item.variants || []).map((variant) => {
      const qty = variant.quantity || 0;
      const price = variant.unitPrice || 0;
      const discountPercent = variant.discount || 0;
      const taxRate = variant.taxRate || 0;

      const grossAmount = qty * price;
      const discountAmount = grossAmount * (discountPercent / 100);
      const amountAfterDiscount = grossAmount - discountAmount;

      // Reverse-calculate: extract tax from the inclusive amount
      const taxableAmount = taxRate > 0
        ? amountAfterDiscount / (1 + taxRate / 100)
        : amountAfterDiscount;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (billType === 'CGST') {
        cgst = taxableAmount * (taxRate / 2 / 100);
        sgst = taxableAmount * (taxRate / 2 / 100);
      } else {
        igst = taxableAmount * (taxRate / 100);
      }

      // totalAmount = amountAfterDiscount (price already includes tax)
      const totalAmount = amountAfterDiscount;

      subtotal += grossAmount;
      totalDiscount += discountAmount;
      totalTaxableAmount += taxableAmount;
      totalCGST += cgst;
      totalSGST += sgst;
      totalIGST += igst;
      itemTotal += totalAmount;

      return {
        ...variant,
        taxableAmount: Math.round(taxableAmount * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        igst: Math.round(igst * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
      };
    });

    return {
      ...item,
      variants: processedVariants,
      itemTotal: Math.round(itemTotal * 100) / 100,
    };
  });

  const totalTax = totalCGST + totalSGST + totalIGST;
  // Grand total = subtotal - discount (prices are tax-inclusive)
  const grandTotalRaw = subtotal - totalDiscount;
  const grandTotal = Math.round(grandTotalRaw);
  const roundOff = Math.round((grandTotal - grandTotalRaw) * 100) / 100;

  return {
    items: processedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    totalTaxableAmount: Math.round(totalTaxableAmount * 100) / 100,
    totalCGST: Math.round(totalCGST * 100) / 100,
    totalSGST: Math.round(totalSGST * 100) / 100,
    totalIGST: Math.round(totalIGST * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    grandTotal,
    roundOff,
    amountInWords: numberToWords(grandTotal),
  };
};

/**
 * Convert a number to Indian English words.
 * e.g., 1250 => "Rupees One Thousand Two Hundred and Fifty Only"
 */
export const numberToWords = (num) => {
  if (num === 0) return 'Rupees Zero Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  const numToWords = (n) => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
  };

  const absNum = Math.abs(Math.round(num));
  return 'Rupees ' + numToWords(absNum) + ' Only';
};

/**
 * Validate GSTIN format (15-character alphanumeric).
 */
export const validateGSTIN = (gstin) => {
  if (!gstin) return true; // Optional field
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
};
