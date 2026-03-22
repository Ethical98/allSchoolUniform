import mongoose from 'mongoose';

const CounterSchema = mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
  prefix: { type: String, default: 'ASU', required: true },
  suffix: { type: String, default: '' },
});

const InvoiceNoSchema = mongoose.Schema({
  _id: { type: String, required: true },
  number: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', CounterSchema);
const InvoiceNumber = mongoose.model('InvoiceNumber', InvoiceNoSchema);
export { InvoiceNumber };

const orderSchema = mongoose.Schema(
  {
    orderId: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        size: { type: String, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
        tax: { type: Number },
        disc: { type: Number },
        schoolName: [{ type: String }],
        productCode: { type: String },
      },
    ],
    modifiedItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        size: { type: String, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
        tax: { type: Number },
        disc: { type: Number },
        schoolName: [{ type: String }],
        productCode: { type: String },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    modified: {
      type: Boolean,
      default: false,
    },

    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: {
      id: { type: String },
      orderId: { type: String },
      signature: { type: String },
      email: { type: String },
      name: { type: String },
    },
    phone: {
      type: String,
      required: true,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    billType: {
      type: String,
      default: 'CGST',
    },
    invoiceNumber: {
      type: String,
    },
    orderStatus: {
      type: String,
      required: true,
    },
    tracking: {
      isConfirmed: {
        type: Boolean,
        required: true,
        default: false,
      },
      isProcessing: {
        type: Boolean,
        required: true,
        default: false,
      },
      isOutForDelivery: {
        type: Boolean,
        required: true,
        default: false,
      },
      processedAt: {
        type: Date,
      },
      outForDeliveryAt: {
        type: Date,
      },
      confirmedAt: {
        type: Date,
      },
      deliveredAt: {
        type: Date,
      },
      isDelivered: {
        type: Boolean,
        required: true,
        default: false,
      },
      canceledAt: {
        type: Date,
      },
      isCanceled: {
        type: Boolean,
        default: false,
      },
    },
    callComments: [
      {
        admin: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        adminName: {
          type: String,
          required: true,
        },
        commentType: {
          type: String,
          enum: ['Call', 'Note', 'Follow-up'],
          default: 'Call',
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    shipping: {
      provider: { type: String, default: 'shiprocket' },
      providerOrderId: { type: Number },
      providerShipmentId: { type: Number },
      awbCode: { type: String },
      courierName: { type: String },
      courierId: { type: Number },
      courierCharges: { type: Number },
      estimatedDeliveryDate: { type: Date },
      pickupLocation: { type: String },
      pickupScheduledDate: { type: Date },
      pickupTokenNumber: { type: String },
      labelUrl: { type: String },
      manifestUrl: { type: String },
      invoiceUrl: { type: String },
      status: { type: String },
      statusCode: { type: Number },
      weight: { type: Number },
      dimensions: {
        length: { type: Number },
        breadth: { type: Number },
        height: { type: Number },
      },
      isRTO: { type: Boolean, default: false },
      rtoInitiatedAt: { type: Date },
      rtoDeliveredAt: { type: Date },
      ndr: {
        isNDR: { type: Boolean, default: false },
        ndrCount: { type: Number, default: 0 },
        lastNdrAt: { type: Date },
        lastNdrReason: { type: String },
        ndrActions: [
          {
            action: {
              type: String,
              enum: ['reattempt', 'rto', 'pending'],
            },
            reason: { type: String },
            newAddress: { type: String },
            newPhone: { type: String },
            preferredDate: { type: Date },
            actionBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
            actionAt: { type: Date, default: Date.now },
          },
        ],
      },
      trackingHistory: [
        {
          status: { type: String },
          statusCode: { type: Number },
          location: { type: String },
          timestamp: { type: Date },
          remarks: { type: String },
        },
      ],
      syncedAt: { type: Date },
      shipAttempt: { type: Number, default: 0 },
      isShipped: { type: Boolean, default: false },
      errors: [
        {
          action: { type: String },
          message: { type: String },
          timestamp: { type: Date, default: Date.now },
        },
      ],
    },
  },
  { timestamps: true }
);

orderSchema.pre('save', async function (next) {
  const doc = this;
  let count;
  if (doc.isNew) {
    count = await Counter.findByIdAndUpdate(
      { _id: 'orderId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
  }

  try {
    if (doc.isNew) {
      const d = new Date();
      doc.orderId =
        count.prefix +
        String(d.getFullYear()) +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0') +
        '-' +
        String(d.getDay()) +
        String(count.seq).padStart(5, '0') +
        count.suffix;
      next();
    }
  } catch (error) {
    throw new Error('Error Creating Order!! Please Try Again..');
  }
});

// ========================================
// Database Indexes for Query Performance
// ========================================

orderSchema.index({ user: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ isPaid: 1 });
orderSchema.index({ user: 1, createdAt: -1 }); // For user order history
orderSchema.index({ 'shipping.awbCode': 1 });
orderSchema.index({ 'shipping.providerOrderId': 1 });
orderSchema.index({ 'shipping.ndr.isNDR': 1 });
orderSchema.index({ 'shipping.isRTO': 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
