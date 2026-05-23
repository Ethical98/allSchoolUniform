import mongoose from 'mongoose';

// ── Counter for auto-generated return IDs (RET-YYYYMMDD-NNNNN) ──────────
const returnCounterSchema = mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const ReturnCounter = mongoose.model('ReturnCounter', returnCounterSchema);

// ── Timeline entry (append-only audit log) ───────────────────────────────
const timelineEntrySchema = mongoose.Schema(
  {
    action: { type: String, required: true },
    fromStatus: { type: String },
    toStatus: { type: String },
    note: { type: String },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ── Return item (embedded sub-document) ──────────────────────────────────
// Field names match OrderModel.orderItems: price, disc, tax
const returnItemSchema = mongoose.Schema(
  {
    // Item identity (denormalized from Order.orderItems)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: { type: String, required: true },
    SKU: { type: String },
    size: { type: String, required: true },
    image: { type: String },

    // Quantities
    originalQty: { type: Number, required: true },
    returnQty: { type: Number, required: true },

    // Pricing snapshot (from order item — uses same field names)
    price: { type: Number, required: true }, // MRP
    disc: { type: Number, default: 0 }, // Discount %
    tax: { type: Number, default: 0 }, // Tax rate %

    // Refund calculation: price * (1 - disc/100) * returnQty
    refundAmount: { type: Number, default: 0 },

    // QC disposition (filled after inspection)
    qcDisposition: {
      type: String,
      enum: ['PENDING', 'GOOD', 'DAMAGED', 'UNSELLABLE', 'NOT_RECEIVED'],
      default: 'PENDING',
    },
    qcNotes: { type: String },
    qcProcessed: { type: Boolean, default: false }, // Concurrency guard

    // For EXCHANGE type: what the customer gets instead
    exchangeProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    exchangeProductName: { type: String },
    exchangeSize: { type: String },
    exchangeUnitPrice: { type: Number },
  },
  { _id: true }
);

// ── Main return request schema ───────────────────────────────────────────
const returnRequestSchema = mongoose.Schema(
  {
    // Identity
    returnId: { type: String, unique: true },

    // Type
    type: {
      type: String,
      required: true,
      enum: ['RETURN', 'EXCHANGE', 'REPLACEMENT'],
    },

    // Status (state machine — see returnStateMachine.js)
    status: {
      type: String,
      required: true,
      default: 'INITIATED',
      enum: [
        'INITIATED',
        'APPROVED',
        'PICKUP_SCHEDULED',
        'PICKUP_FAILED',
        'IN_TRANSIT',
        'RECEIVED',
        'QC_IN_PROGRESS',
        'QC_COMPLETED',
        'REFUND_INITIATED',
        'EXCHANGE_SHIPPED',
        'REPLACEMENT_SHIPPED',
        'COMPLETED',
        'REJECTED',
        'CANCELLED',
      ],
    },

    // Links to original order
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    orderId: { type: String, required: true },
    invoiceNumber: { type: String },

    // Customer (denormalized)
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    customerPhone: { type: String },

    // Items being returned
    items: [returnItemSchema],

    // Reason
    reason: {
      type: String,
      required: true,
      enum: [
        'DEFECTIVE',
        'WRONG_ITEM',
        'WRONG_SIZE',
        'QUALITY_ISSUE',
        'NOT_AS_DESCRIBED',
        'CHANGED_MIND',
        'DAMAGED_IN_TRANSIT',
        'OTHER',
      ],
    },
    reasonDetails: { type: String },

    // Pickup / Reverse shipping
    pickupAddress: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String, default: 'India' },
      phone: { type: String },
    },
    reverseShipping: {
      provider: { type: String, default: 'shiprocket' },
      providerOrderId: { type: Number },
      providerShipmentId: { type: Number },
      awbCode: { type: String },
      courierName: { type: String },
      courierId: { type: Number },
      trackingUrl: { type: String },
      pickupScheduledDate: { type: Date },
      pickupTokenNumber: { type: String },
      labelUrl: { type: String },
      status: { type: String },
      receivedAt: { type: Date },
      weight: { type: Number },
      dimensions: {
        length: { type: Number },
        breadth: { type: Number },
        height: { type: Number },
      },
    },

    // Financial — refund
    refundAmount: { type: Number, default: 0 },
    shippingRefundAmount: { type: Number, default: 0 },
    refundMethod: {
      type: String,
      enum: ['ORIGINAL_PAYMENT', 'BANK_TRANSFER', 'UPI', 'STORE_CREDIT'],
    },
    refundTransactionId: { type: String },
    refundProcessedAt: { type: Date },
    refundBankDetails: {
      accountNumber: { type: String },
      ifscCode: { type: String },
      accountHolderName: { type: String },
    },
    refundUpiId: { type: String },

    // Financial — exchange
    exchangeOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    exchangeOrderNumber: { type: String },
    priceDifference: { type: Number, default: 0 },
    priceDifferenceCollected: { type: Boolean, default: false },

    // Credit note
    creditNote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillQuotation',
    },
    creditNoteNumber: { type: String },

    // Billing context (from original order)
    billType: { type: String, enum: ['CGST', 'IGST'], default: 'CGST' },

    // Validation overrides
    overrideReturnWindow: { type: Boolean, default: false },

    // Audit trail
    timeline: [timelineEntrySchema],

    // Admin
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdByName: { type: String, required: true },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

// ── Pre-save hook: auto-generate returnId ────────────────────────────────
returnRequestSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await ReturnCounter.findByIdAndUpdate(
      { _id: 'returnId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    this.returnId = `RET-${dateStr}-${String(counter.seq).padStart(5, '0')}`;
  }
  next();
});

// ── Indexes ──────────────────────────────────────────────────────────────
returnRequestSchema.index({ order: 1 });
returnRequestSchema.index({ returnId: 1 });
returnRequestSchema.index({ status: 1 });
returnRequestSchema.index({ customer: 1 });
returnRequestSchema.index({ createdAt: -1 });
returnRequestSchema.index({ type: 1, status: 1 });
returnRequestSchema.index({ exchangeOrderId: 1 });

const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);

export { ReturnCounter };
export default ReturnRequest;
