import mongoose from 'mongoose';

const shippingLogSchema = mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    asuOrderId: { type: String },
    action: {
      type: String,
      required: true,
      enum: [
        'AUTH',
        'CREATE_ORDER',
        'ASSIGN_AWB',
        'SCHEDULE_PICKUP',
        'GENERATE_LABEL',
        'GENERATE_MANIFEST',
        'CANCEL_ORDER',
        'CANCEL_SHIPMENT',
        'TRACK',
        'SERVICEABILITY',
        'NDR_LIST',
        'NDR_REATTEMPT',
        'NDR_RTO',
        'WEBHOOK',
        'PICKUP_LOCATIONS',
        'GENERATE_INVOICE',
        'ADD_PICKUP_LOCATION',
      ],
    },
    endpoint: { type: String },
    requestPayload: { type: mongoose.Schema.Types.Mixed },
    responsePayload: { type: mongoose.Schema.Types.Mixed },
    statusCode: { type: Number },
    success: { type: Boolean },
    errorMessage: { type: String },
    duration: { type: Number },
    source: {
      type: String,
      enum: ['admin', 'webhook', 'cron'],
      default: 'admin',
    },
  },
  { timestamps: true }
);

shippingLogSchema.index({ orderId: 1 });
shippingLogSchema.index({ action: 1 });
shippingLogSchema.index({ createdAt: -1 });

const ShippingLog = mongoose.model('ShippingLog', shippingLogSchema);

export default ShippingLog;
