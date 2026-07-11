import mongoose from 'mongoose';

const stockAlertSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: { type: String, required: true }, // Denormalized
    SKU: { type: String },
    size: { type: String, required: true },

    currentStock: { type: Number, required: true },
    alertThreshold: { type: Number, required: true }, // alertOnQty value

    status: {
      type: String,
      enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'],
      default: 'ACTIVE',
    },

    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for common queries
stockAlertSchema.index({ status: 1, createdAt: -1 });
stockAlertSchema.index({ product: 1, size: 1 });

const StockAlert = mongoose.model('StockAlert', stockAlertSchema);

export default StockAlert;
