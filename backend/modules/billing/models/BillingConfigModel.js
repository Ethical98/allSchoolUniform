import mongoose from 'mongoose';

const billingConfigSchema = mongoose.Schema(
  {
    showHSN: { type: Boolean, default: true },
    showSKU: { type: Boolean, default: true },
    showPaymentInfo: { type: Boolean, default: true },
    taxEnabled: { type: Boolean, default: true },
    defaultTaxRate: { type: Number, default: 5 },
    defaultHSNCode: { type: String, default: '6203' },
    standardTaxRates: { type: [Number], default: [0, 5, 12, 18, 28] },
  },
  { timestamps: true }
);

const BillingConfig = mongoose.model('BillingConfig', billingConfigSchema);

export default BillingConfig;
