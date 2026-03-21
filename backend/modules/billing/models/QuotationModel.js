import mongoose from 'mongoose';

const variantSchema = mongoose.Schema({
  size: { type: String },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  dbPrice: { type: Number }, // Original DB price snapshot
  discount: { type: Number, default: 0 }, // Discount %
  taxRate: { type: Number, default: 5 }, // GST %
  hsnCode: { type: String },
  taxableAmount: { type: Number },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalAmount: { type: Number },
  stockAtTimeOfQuote: { type: Number }, // Stock snapshot
});

const itemSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  isCustomItem: { type: Boolean, default: false },
  name: { type: String, required: true },
  sku: { type: String },
  image: { type: String },
  description: { type: String },
  schoolName: { type: String },
  category: { type: String },
  variants: [variantSchema],
  itemTotal: { type: Number, default: 0 },
});

const revisionEntrySchema = mongoose.Schema({
  version: { type: Number },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedAt: { type: Date, default: Date.now },
  changeNote: { type: String },
});

const senderSnapshotSchema = mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'BillCompany' },
  name: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  gstin: { type: String },
  pan: { type: String },
  phone: { type: String },
  email: { type: String },
  logo: { type: String },
  bankName: { type: String },
  accountNumber: { type: String },
  ifscCode: { type: String },
  branchName: { type: String },
  upiId: { type: String },
});

const buyerSnapshotSchema = mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'BillCompany' },
  name: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  gstin: { type: String },
  contactPerson: { type: String },
  phone: { type: String },
  email: { type: String },
  schoolRef: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
});

const quotationSchema = mongoose.Schema(
  {
    // Identity
    documentNumber: {
      type: String,
      required: true,
      unique: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: ['QUOTATION', 'PROFORMA_INVOICE', 'TAX_INVOICE', 'CASH_BILL', 'CREDIT_NOTE', 'DEBIT_NOTE'],
    },
    status: {
      type: String,
      default: 'DRAFT',
      enum: ['DRAFT', 'SENT', 'ACCEPTED', 'CONVERTED', 'EXPIRED', 'CANCELLED'],
    },

    // Parties
    sender: senderSnapshotSchema,
    buyer: buyerSnapshotSchema,

    // Walk-in customer (for CASH_BILL)
    walkInCustomer: {
      name: { type: String },
      phone: { type: String },
    },
    paymentMode: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE'],
    },
    paymentReceived: {
      type: Boolean,
      default: false,
    },

    // Payment Tracking
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE'],
      default: 'UNPAID',
    },
    paymentDueDate: { type: Date },
    amountPaid: { type: Number, default: 0 },
    payments: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        method: {
          type: String,
          enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE'],
        },
        referenceNo: { type: String },
        remarks: { type: String },
        recordedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],

    // Branding & Messaging
    coverMessage: { type: String },
    headerNote: { type: String },
    footerNote: { type: String },

    // Line Items
    items: [itemSchema],

    // Totals
    subtotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalTaxableAmount: { type: Number, default: 0 },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    shippingCharges: { type: Number, default: 0 },
    additionalCharges: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    amountInWords: { type: String },
    roundOff: { type: Number, default: 0 },

    // Tax Config
    billType: {
      type: String,
      enum: ['CGST', 'IGST'],
      default: 'CGST',
    },
    placeOfSupply: { type: String },

    // Validity & Terms
    validUntil: { type: Date },
    paymentTerms: { type: String },
    deliveryTerms: { type: String },

    // Versioning & Cloning
    version: { type: Number, default: 1 },
    parentDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillQuotation',
    },
    clonedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillQuotation',
    },
    convertedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillQuotation',
    },
    revisionHistory: [revisionEntrySchema],

    // PDF
    pdfUrl: { type: String },
    pdfGeneratedAt: { type: Date },

    // Stock
    stockDeducted: { type: Boolean, default: false },

    // Credit Note / Debit Note
    linkedInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillQuotation',
    },
    reason: { type: String }, // Reason for CN/DN

    // System
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

quotationSchema.index({ documentNumber: 1 });
quotationSchema.index({ documentType: 1, status: 1 });
quotationSchema.index({ 'buyer.company': 1 });
quotationSchema.index({ createdAt: -1 });
quotationSchema.index({ parentDocument: 1 });
quotationSchema.index({ linkedInvoice: 1 });

const BillQuotation = mongoose.model('BillQuotation', quotationSchema);

export default BillQuotation;
