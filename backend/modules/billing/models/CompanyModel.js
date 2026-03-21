import mongoose from 'mongoose';

const companySchema = mongoose.Schema(
  {
    companyType: {
      type: String,
      required: true,
      enum: ['SENDER', 'BUYER'],
    },
    name: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    // Address
    address: { type: String },       // legacy — kept for backward compat
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: 'India' },
    // Contact
    contactPerson: { type: String },
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    // Tax & Legal
    gstin: { type: String },
    pan: { type: String },
    // Branding (for SENDER type)
    logo: { type: String },
    // Banking (for SENDER type, shown on invoices)
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    branchName: { type: String },
    upiId: { type: String },
    // Link to existing School (for BUYER type)
    schoolRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
    },
    // System
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

companySchema.index({ companyType: 1 });
companySchema.index({ name: 'text', city: 'text' });
companySchema.index({ isActive: 1 });

const BillCompany = mongoose.model('BillCompany', companySchema);

export default BillCompany;
