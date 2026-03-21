import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import BillQuotation from '../models/QuotationModel.js';
import BillCompany from '../models/CompanyModel.js';
import Product from '../../../models/ProductModel.js';
import StockMovement from '../../stock/models/StockMovementModel.js';
import {
  generateDocumentNumber,
  calculateTotals,
  numberToWords,
} from '../utils/quotationUtils.js';
import { escapeRegex } from '../../../utils/stringUtils.js';

/**
 * Create a snapshot of a company's details for embedding in the document.
 */
/**
 * Transform flat items from frontend into nested items with variants.
 * Frontend sends: [{ productRef, name, hsnCode, size, quantity, unitPrice, discount, taxRate }]
 * Backend expects: [{ product, name, isCustomItem, variants: [{ size, quantity, unitPrice, ... }] }]
 */
const groupFlatItemsToNested = (flatItems) => {
  const grouped = {};
  const customItems = [];

  for (const item of flatItems) {
    const variant = {
      size: item.size || '',
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      discount: item.discount || 0,
      taxRate: item.taxRate || 0,
      hsnCode: item.hsnCode || '',
    };

    if (item.productRef) {
      const key = String(item.productRef);
      if (!grouped[key]) {
        grouped[key] = {
          product: item.productRef,
          name: item.name || '',
          sku: item.sku || '',
          isCustomItem: false,
          variants: [],
        };
      }
      grouped[key].variants.push(variant);
    } else {
      customItems.push({
        name: item.name || 'Custom Item',
        isCustomItem: true,
        variants: [variant],
      });
    }
  }

  return [...Object.values(grouped), ...customItems];
};

const createCompanySnapshot = (company, type) => {
  const snapshot = {
    company: company._id,
    name: company.name,
    address: company.addressLine1
      ? [company.addressLine1, company.addressLine2].filter(Boolean).join(', ')
      : company.address,
    city: company.city,
    state: company.state,
    pincode: company.pincode,
    gstin: company.gstin,
    phone: company.phone,
    email: company.email,
  };

  if (type === 'SENDER') {
    snapshot.pan = company.pan;
    snapshot.logo = company.logo;
    snapshot.bankName = company.bankName;
    snapshot.accountNumber = company.accountNumber;
    snapshot.ifscCode = company.ifscCode;
    snapshot.branchName = company.branchName;
    snapshot.upiId = company.upiId;
  } else {
    snapshot.contactPerson = company.contactPerson;
    snapshot.schoolRef = company.schoolRef;
  }

  return snapshot;
};

// @desc    Create a new quotation/PI/invoice
// @route   POST /api/billing/quotations
// @access  Private/Admin
const createQuotation = asyncHandler(async (req, res) => {
  const {
    documentType, senderId, sender: senderIdAlt, buyerId, buyer: buyerIdAlt,
    items, billType,
    coverMessage, headerNote, footerNote, validUntil,
    paymentTerms, deliveryTerms, placeOfSupply,
    shippingCharges, additionalCharges,
  } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No items provided');
  }

  // Validate each item has required fields
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.name && !item.productRef) {
      res.status(400);
      throw new Error(`Item ${i + 1}: name or product reference is required`);
    }
    if (!item.quantity || Number(item.quantity) <= 0) {
      res.status(400);
      throw new Error(`Item ${i + 1}: quantity must be greater than 0`);
    }
    if (item.unitPrice === undefined || Number(item.unitPrice) < 0) {
      res.status(400);
      throw new Error(`Item ${i + 1}: unitPrice must be a non-negative number`);
    }
    if (item.discount !== undefined && (Number(item.discount) < 0 || Number(item.discount) > 100)) {
      res.status(400);
      throw new Error(`Item ${i + 1}: discount must be between 0 and 100`);
    }
    if (item.taxRate !== undefined && Number(item.taxRate) < 0) {
      res.status(400);
      throw new Error(`Item ${i + 1}: taxRate must be non-negative`);
    }
  }

  // Support both senderId and sender field names from frontend
  const resolvedSenderId = senderId || senderIdAlt;
  const resolvedBuyerId = buyerId || buyerIdAlt;

  // Get sender and buyer companies
  const sender = await BillCompany.findById(resolvedSenderId);
  if (!sender) {
    res.status(404);
    throw new Error('Sender company not found');
  }

  const buyer = await BillCompany.findById(resolvedBuyerId);
  if (!buyer) {
    res.status(404);
    throw new Error('Buyer company not found');
  }

  // Generate document number
  const documentNumber = await generateDocumentNumber(documentType);

  // Transform flat items from frontend into nested format
  const nestedItems = groupFlatItemsToNested(items);

  // Populate SKU from Product for product-based items
  for (const item of nestedItems) {
    if (item.product && !item.sku) {
      const prod = await Product.findById(item.product).select('SKU').lean();
      if (prod) item.sku = prod.SKU || '';
    }
  }

  // Calculate totals
  const totals = calculateTotals(nestedItems, billType || 'CGST');

  const quotation = await BillQuotation.create({
    documentNumber,
    documentType,
    status: 'DRAFT',
    sender: createCompanySnapshot(sender, 'SENDER'),
    buyer: createCompanySnapshot(buyer, 'BUYER'),
    items: totals.items,
    subtotal: totals.subtotal,
    totalDiscount: totals.totalDiscount,
    totalTaxableAmount: totals.totalTaxableAmount,
    totalCGST: totals.totalCGST,
    totalSGST: totals.totalSGST,
    totalIGST: totals.totalIGST,
    totalTax: totals.totalTax,
    grandTotal: Math.round(totals.grandTotal + (shippingCharges || 0) + (additionalCharges || 0)),
    amountInWords: numberToWords(Math.round(totals.grandTotal + (shippingCharges || 0) + (additionalCharges || 0))),
    roundOff: totals.roundOff,
    billType: billType || 'CGST',
    placeOfSupply,
    shippingCharges: shippingCharges || 0,
    additionalCharges: additionalCharges || 0,
    coverMessage,
    headerNote,
    footerNote,
    validUntil,
    paymentTerms,
    deliveryTerms,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  res.status(201).json(quotation);
});

// @desc    Get all quotations (paginated, filterable)
// @route   GET /api/billing/quotations
// @access  Private/Admin
const getQuotations = asyncHandler(async (req, res) => {
  const pageSize = 20;
  const page = Number(req.query.page) || 1;
  const documentType = req.query.documentType || '';
  const status = req.query.status || '';
  const buyerId = req.query.buyer || '';
  const search = req.query.search || '';
  const startDate = req.query.startDate || '';
  const endDate = req.query.endDate || '';

  const filter = {};

  if (documentType) filter.documentType = documentType;
  if (status) filter.status = status;
  if (buyerId) filter['buyer.company'] = buyerId;
  if (search) {
    const escapedSearch = escapeRegex(search);
    filter.$or = [
      { documentNumber: { $regex: escapedSearch, $options: 'i' } },
      { 'buyer.name': { $regex: escapedSearch, $options: 'i' } },
    ];
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
  }

  const count = await BillQuotation.countDocuments(filter);
  const quotations = await BillQuotation.find(filter)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .select('documentNumber documentType status buyer.name walkInCustomer grandTotal createdAt validUntil paymentStatus amountPaid');

  res.json({
    quotations,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc    Get quotation by ID
// @route   GET /api/billing/quotations/:id
// @access  Private/Admin
const getQuotationById = asyncHandler(async (req, res) => {
  const quotation = await BillQuotation.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (quotation) {
    res.json(quotation);
  } else {
    res.status(404);
    throw new Error('Quotation not found');
  }
});

// @desc    Update quotation (DRAFT only)
// @route   PUT /api/billing/quotations/:id
// @access  Private/Admin
const updateQuotation = asyncHandler(async (req, res) => {
  const quotation = await BillQuotation.findById(req.params.id);

  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  if (quotation.status !== 'DRAFT') {
    res.status(400);
    throw new Error('Only DRAFT documents can be edited');
  }

  const {
    items, billType, coverMessage, headerNote, footerNote,
    validUntil, paymentTerms, deliveryTerms, placeOfSupply,
    shippingCharges, additionalCharges,
    senderId, sender: senderIdAlt, buyerId, buyer: buyerIdAlt,
  } = req.body;

  const resolvedSenderId = senderId || senderIdAlt;
  const resolvedBuyerId = buyerId || buyerIdAlt;

  // Update sender/buyer if changed
  if (resolvedSenderId && resolvedSenderId !== String(quotation.sender?.company || '')) {
    const sender = await BillCompany.findById(resolvedSenderId);
    if (!sender) {
      res.status(404);
      throw new Error('Sender company not found');
    }
    quotation.sender = createCompanySnapshot(sender, 'SENDER');
  }

  if (resolvedBuyerId && resolvedBuyerId !== String(quotation.buyer?.company || '')) {
    const buyer = await BillCompany.findById(resolvedBuyerId);
    if (!buyer) {
      res.status(404);
      throw new Error('Buyer company not found');
    }
    quotation.buyer = createCompanySnapshot(buyer, 'BUYER');
  }

  // Recalculate if items changed
  if (items) {
    const nestedItems = groupFlatItemsToNested(items);

    // Populate SKU from Product for product-based items
    for (const item of nestedItems) {
      if (item.product && !item.sku) {
        const prod = await Product.findById(item.product).select('SKU').lean();
        if (prod) item.sku = prod.SKU || '';
      }
    }

    const totals = calculateTotals(nestedItems, billType || quotation.billType);
    const shipping = shippingCharges !== undefined ? shippingCharges : quotation.shippingCharges;
    const additional = additionalCharges !== undefined ? additionalCharges : quotation.additionalCharges;

    quotation.items = totals.items;
    quotation.subtotal = totals.subtotal;
    quotation.totalDiscount = totals.totalDiscount;
    quotation.totalTaxableAmount = totals.totalTaxableAmount;
    quotation.totalCGST = totals.totalCGST;
    quotation.totalSGST = totals.totalSGST;
    quotation.totalIGST = totals.totalIGST;
    quotation.totalTax = totals.totalTax;
    quotation.grandTotal = Math.round(totals.grandTotal + shipping + additional);
    quotation.amountInWords = numberToWords(Math.round(totals.grandTotal + shipping + additional));
    quotation.roundOff = totals.roundOff;
  }

  if (billType) quotation.billType = billType;
  if (coverMessage !== undefined) quotation.coverMessage = coverMessage;
  if (headerNote !== undefined) quotation.headerNote = headerNote;
  if (footerNote !== undefined) quotation.footerNote = footerNote;
  if (validUntil !== undefined) quotation.validUntil = validUntil;
  if (paymentTerms !== undefined) quotation.paymentTerms = paymentTerms;
  if (deliveryTerms !== undefined) quotation.deliveryTerms = deliveryTerms;
  if (placeOfSupply !== undefined) quotation.placeOfSupply = placeOfSupply;
  if (shippingCharges !== undefined) quotation.shippingCharges = shippingCharges;
  if (additionalCharges !== undefined) quotation.additionalCharges = additionalCharges;

  quotation.updatedBy = req.user._id;

  const updated = await quotation.save();
  res.json(updated);
});

// @desc    Delete quotation (only DRAFT)
// @route   DELETE /api/billing/quotations/:id
// @access  Private/Admin
const deleteQuotation = asyncHandler(async (req, res) => {
  const quotation = await BillQuotation.findById(req.params.id);

  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  if (quotation.status !== 'DRAFT') {
    res.status(400);
    throw new Error('Only DRAFT documents can be deleted');
  }

  quotation.status = 'CANCELLED';
  await quotation.save();

  res.json({ message: 'Document cancelled' });
});

// @desc    Update quotation status
// @route   PATCH /api/billing/quotations/:id/status
// @access  Private/Admin
const updateQuotationStatus = asyncHandler(async (req, res) => {
  const quotation = await BillQuotation.findById(req.params.id);

  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  const { status } = req.body;
  const validTransitions = {
    DRAFT: ['SENT', 'CANCELLED'],
    SENT: ['ACCEPTED', 'EXPIRED', 'CANCELLED'],
    ACCEPTED: ['CONVERTED', 'CANCELLED'],
  };

  const allowed = validTransitions[quotation.status] || [];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(`Cannot transition from ${quotation.status} to ${status}`);
  }

  quotation.status = status;
  quotation.updatedBy = req.user._id;
  await quotation.save();

  res.json(quotation);
});

// @desc    Clone a quotation
// @route   POST /api/billing/quotations/:id/clone
// @access  Private/Admin
const cloneQuotation = asyncHandler(async (req, res) => {
  const original = await BillQuotation.findById(req.params.id);

  if (!original) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  const targetType = req.body.documentType || original.documentType;
  const documentNumber = await generateDocumentNumber(targetType);

  const cloneData = original.toObject();
  delete cloneData._id;
  delete cloneData.createdAt;
  delete cloneData.updatedAt;

  const clone = await BillQuotation.create({
    ...cloneData,
    documentNumber,
    documentType: targetType,
    status: 'DRAFT',
    clonedFrom: original._id,
    convertedTo: null,
    parentDocument: null,
    version: 1,
    revisionHistory: [],
    stockDeducted: false,
    pdfUrl: null,
    pdfGeneratedAt: null,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  res.status(201).json(clone);
});

// @desc    Convert quotation (Quote → PI → Invoice)
// @route   POST /api/billing/quotations/:id/convert
// @access  Private/Admin
const convertQuotation = asyncHandler(async (req, res) => {
  const original = await BillQuotation.findById(req.params.id);

  if (!original) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  const conversionMap = {
    QUOTATION: 'PROFORMA_INVOICE',
    PROFORMA_INVOICE: 'TAX_INVOICE',
  };

  const targetType = req.body.documentType || conversionMap[original.documentType];
  if (!targetType) {
    res.status(400);
    throw new Error('Cannot convert this document type');
  }

  const documentNumber = await generateDocumentNumber(targetType);

  const convertData = original.toObject();
  delete convertData._id;
  delete convertData.createdAt;
  delete convertData.updatedAt;

  const converted = await BillQuotation.create({
    ...convertData,
    documentNumber,
    documentType: targetType,
    status: 'DRAFT',
    parentDocument: original._id,
    clonedFrom: null,
    convertedTo: null,
    version: 1,
    revisionHistory: [],
    stockDeducted: false,
    pdfUrl: null,
    pdfGeneratedAt: null,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  // Update original with conversion reference
  original.convertedTo = converted._id;
  original.status = 'CONVERTED';
  await original.save();

  res.status(201).json(converted);
});

// @desc    Create a revision of a document
// @route   POST /api/billing/quotations/:id/revision
// @access  Private/Admin
const createRevision = asyncHandler(async (req, res) => {
  const original = await BillQuotation.findById(req.params.id);

  if (!original) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  // Add revision entry to original
  original.revisionHistory.push({
    version: original.version,
    changedBy: req.user._id,
    changedAt: new Date(),
    changeNote: req.body.changeNote || 'Revised',
  });

  original.version += 1;
  original.status = 'DRAFT';
  original.updatedBy = req.user._id;
  await original.save();

  res.json(original);
});

// @desc    Search products for quotation (stock-aware)
// @route   GET /api/billing/quotations/products
// @access  Private/Admin
const getProductsForPicker = asyncHandler(async (req, res) => {
  const search = req.query.search || '';
  const limit = Number(req.query.limit) || 20;

  const filter = { isActive: true };

  if (search) {
    const escapedSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { SKU: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  const products = await Product.find(filter)
    .select('name SKU image schoolName type category size')
    .limit(Math.min(limit, 100))
    .lean();

  // Add stock status to each size variant
  const enriched = products.map((p) => ({
    ...p,
    size: (p.size || []).map((s) => ({
      ...s,
      inStock: s.countInStock > 0 && !s.outOfStock,
    })),
  }));

  res.json(enriched);
});

// @desc    Create cash bill (POS-style quick bill for walk-in customers)
// @route   POST /api/billing/cash-bill
// @access  Private/Admin
const createCashBill = asyncHandler(async (req, res) => {
  const {
    customerName, customerPhone, walkInCustomer, items, paymentMode, paymentRef, billType, notes,
  } = req.body;
  const custName = customerName || walkInCustomer?.name || 'Walk-in Customer';
  const custPhone = customerPhone || walkInCustomer?.phone || '';

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No items provided');
  }

  // Get default sender company, or use provided sender ID
  const senderId = req.body.sender;
  let sender;
  if (senderId) {
    sender = await BillCompany.findById(senderId);
  }
  if (!sender) {
    sender = await BillCompany.findOne({ companyType: 'SENDER', isDefault: true, isActive: true });
  }

  const documentNumber = await generateDocumentNumber('CASH_BILL');

  // Transform flat items from frontend into nested format
  const nestedItems = groupFlatItemsToNested(items);

  // Populate SKU from Product for product-based items
  for (const item of nestedItems) {
    if (item.product && !item.sku) {
      const prod = await Product.findById(item.product).select('SKU').lean();
      if (prod) item.sku = prod.SKU || '';
    }
  }

  const totals = calculateTotals(nestedItems, billType || 'CGST');

  // Use a transaction so bill creation + stock deduction are atomic
  const session = await mongoose.startSession();
  let cashBill;

  try {
    await session.withTransaction(async () => {
      [cashBill] = await BillQuotation.create(
        [
          {
            documentNumber,
            documentType: 'CASH_BILL',
            status: 'SENT', // Cash bills are immediately finalized
            sender: sender ? createCompanySnapshot(sender, 'SENDER') : {},
            walkInCustomer: {
              name: custName,
              phone: custPhone,
            },
            paymentMode: paymentMode || 'CASH',
            paymentReceived: true,
            paymentStatus: 'PAID',
            amountPaid: totals.grandTotal,
            payments: [
              {
                amount: totals.grandTotal,
                date: new Date(),
                method: paymentMode || 'CASH',
                referenceNo: paymentRef || '',
                remarks: 'Cash bill - paid at counter',
                recordedBy: req.user._id,
              },
            ],
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
            billType: billType || 'CGST',
            headerNote: notes || '',
            stockDeducted: true,
            createdBy: req.user._id,
            updatedBy: req.user._id,
          },
        ],
        { session }
      );

      // Deduct stock atomically for cash bills using $inc to prevent lost writes
      for (const item of cashBill.items) {
        if (item.product) {
          for (const variant of item.variants) {
            // Atomic decrement — avoids read-modify-save race condition
            const updated = await Product.findOneAndUpdate(
              { _id: item.product, 'size.size': variant.size },
              { $inc: { 'size.$.countInStock': -variant.quantity } },
              { new: true, session }
            );

            if (updated) {
              const sizeVariant = updated.size.find((s) => s.size === variant.size);
              const newStock = sizeVariant ? sizeVariant.countInStock : 0;
              const previousStock = newStock + variant.quantity;

              await StockMovement.create(
                [
                  {
                    product: item.product,
                    productName: updated.name,
                    SKU: updated.SKU,
                    size: variant.size,
                    type: 'QUOTATION_RESERVE',
                    quantityChange: -variant.quantity,
                    previousStock,
                    newStock,
                    quotation: cashBill._id,
                    quotationNumber: documentNumber,
                    performedBy: req.user._id,
                    performedByName: req.user.name,
                    reason: `Cash bill ${documentNumber}`,
                  },
                ],
                { session }
              );
            }
          }
        }
      }
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json(cashBill);
});

// @desc    Create a credit note against an invoice
// @route   POST /api/billing/credit-note
// @access  Private/Admin
const createCreditNote = asyncHandler(async (req, res) => {
  const { invoiceId, items, reason } = req.body;

  if (!invoiceId) {
    res.status(400);
    throw new Error('Invoice ID is required');
  }

  const invoice = await BillQuotation.findById(invoiceId);
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  if (!['TAX_INVOICE', 'CASH_BILL'].includes(invoice.documentType)) {
    res.status(400);
    throw new Error('Credit notes can only be created against invoices or cash bills');
  }

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No items provided for credit note');
  }

  const documentNumber = await generateDocumentNumber('CREDIT_NOTE');
  const nestedItems = groupFlatItemsToNested(items);
  const totals = calculateTotals(nestedItems, invoice.billType);

  const creditNote = await BillQuotation.create({
    documentNumber,
    documentType: 'CREDIT_NOTE',
    status: 'DRAFT',
    sender: invoice.sender,
    buyer: invoice.buyer,
    walkInCustomer: invoice.walkInCustomer,
    linkedInvoice: invoice._id,
    reason: reason || '',
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
    billType: invoice.billType,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  res.status(201).json(creditNote);
});

// @desc    Create a debit note against an invoice
// @route   POST /api/billing/debit-note
// @access  Private/Admin
const createDebitNote = asyncHandler(async (req, res) => {
  const { invoiceId, items, reason } = req.body;

  if (!invoiceId) {
    res.status(400);
    throw new Error('Invoice ID is required');
  }

  const invoice = await BillQuotation.findById(invoiceId);
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  if (!['TAX_INVOICE', 'CASH_BILL'].includes(invoice.documentType)) {
    res.status(400);
    throw new Error('Debit notes can only be created against invoices or cash bills');
  }

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No items provided for debit note');
  }

  const documentNumber = await generateDocumentNumber('DEBIT_NOTE');
  const nestedItems = groupFlatItemsToNested(items);
  const totals = calculateTotals(nestedItems, invoice.billType);

  const debitNote = await BillQuotation.create({
    documentNumber,
    documentType: 'DEBIT_NOTE',
    status: 'DRAFT',
    sender: invoice.sender,
    buyer: invoice.buyer,
    walkInCustomer: invoice.walkInCustomer,
    linkedInvoice: invoice._id,
    reason: reason || '',
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
    billType: invoice.billType,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  res.status(201).json(debitNote);
});

// @desc    Record a payment against an invoice
// @route   POST /api/billing/quotations/:id/payment
// @access  Private/Admin
const recordPayment = asyncHandler(async (req, res) => {
  const quotation = await BillQuotation.findById(req.params.id);

  if (!quotation) {
    res.status(404);
    throw new Error('Document not found');
  }

  if (quotation.paymentStatus === 'PAID') {
    res.status(400);
    throw new Error('This document is already fully paid');
  }

  const { amount, method, referenceNo, remarks, date } = req.body;

  const parsedAmount = Number(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400);
    throw new Error('Payment amount must be a positive number');
  }

  // Validate currency precision (max 2 decimal places)
  if (Math.round(parsedAmount * 100) !== parsedAmount * 100) {
    res.status(400);
    throw new Error('Payment amount cannot have more than 2 decimal places');
  }

  const newAmountPaid = (quotation.amountPaid || 0) + parsedAmount;

  if (newAmountPaid > quotation.grandTotal) {
    res.status(400);
    throw new Error(`Payment exceeds outstanding amount. Outstanding: ${quotation.grandTotal - (quotation.amountPaid || 0)}`);
  }

  quotation.payments.push({
    amount: parsedAmount,
    date: date || new Date(),
    method: method || 'CASH',
    referenceNo: referenceNo || '',
    remarks: remarks || '',
    recordedBy: req.user._id,
  });

  quotation.amountPaid = newAmountPaid;
  quotation.paymentStatus = newAmountPaid >= quotation.grandTotal ? 'PAID' : 'PARTIAL';
  quotation.updatedBy = req.user._id;

  const updated = await quotation.save();
  res.json(updated);
});

// @desc    Get billing report summary
// @route   GET /api/billing/report
// @access  Private/Admin
const getBillingReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, documentType, buyerName } = req.query;

  const filter = { status: { $ne: 'CANCELLED' } };

  if (documentType) {
    filter.documentType = documentType;
  }
  if (buyerName) {
    filter['buyer.name'] = { $regex: escapeRegex(buyerName), $options: 'i' };
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
  }

  const documents = await BillQuotation.find(filter)
    .select('documentNumber documentType status grandTotal amountPaid paymentStatus buyer walkInCustomer createdAt billType totalCGST totalSGST totalIGST totalTax totalTaxableAmount')
    .sort({ createdAt: -1 })
    .lean();

  // Summary calculations
  const invoices = documents.filter((d) => ['TAX_INVOICE', 'CASH_BILL'].includes(d.documentType));
  const creditNotes = documents.filter((d) => d.documentType === 'CREDIT_NOTE');

  const totalInvoiced = invoices.reduce((sum, d) => sum + (d.grandTotal || 0), 0);
  const totalCollected = invoices.reduce((sum, d) => sum + (d.amountPaid || 0), 0);
  const totalOutstanding = totalInvoiced - totalCollected;
  const totalCreditNotes = creditNotes.reduce((sum, d) => sum + (d.grandTotal || 0), 0);

  // Overdue invoices
  const overdueInvoices = invoices.filter((d) => d.paymentStatus === 'OVERDUE');

  // Tax summary (HSN-wise aggregation)
  const taxSummary = {
    totalTaxableAmount: invoices.reduce((sum, d) => sum + (d.totalTaxableAmount || 0), 0),
    totalCGST: invoices.reduce((sum, d) => sum + (d.totalCGST || 0), 0),
    totalSGST: invoices.reduce((sum, d) => sum + (d.totalSGST || 0), 0),
    totalIGST: invoices.reduce((sum, d) => sum + (d.totalIGST || 0), 0),
    totalTax: invoices.reduce((sum, d) => sum + (d.totalTax || 0), 0),
  };

  res.json({
    summary: {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalCreditNotes,
      invoiceCount: invoices.length,
      overdueCount: overdueInvoices.length,
    },
    taxSummary,
    documents,
    overdueInvoices,
  });
});

export {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  cloneQuotation,
  convertQuotation,
  createRevision,
  getProductsForPicker,
  createCashBill,
  createCreditNote,
  createDebitNote,
  recordPayment,
  getBillingReport,
};
