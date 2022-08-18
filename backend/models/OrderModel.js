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
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    phone: {
      type: Number,
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

const Order = mongoose.model('Order', orderSchema);

export default Order;
