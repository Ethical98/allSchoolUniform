import mongoose from 'mongoose';

const schoolSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  orders: {
    type: Number,
  },
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  website: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  country: {
    type: String,
    required: true,
    default: 'India',
  },

  isFeatured: {
    type: Boolean,
    default: false,
  },
  featuredOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: false,
    rquired: true,
  },
});

// ========================================
// Database Indexes for Query Performance
// ========================================

schoolSchema.index({ name: 1 });
schoolSchema.index({ isActive: 1 });
schoolSchema.index({ city: 1 });
schoolSchema.index({ state: 1 });
schoolSchema.index({ isFeatured: -1, featuredOrder: 1 });
schoolSchema.index({ isActive: 1, city: 1 });

// Text index for school search
schoolSchema.index({ name: 'text', address: 'text', city: 'text' });

const School = mongoose.model('School', schoolSchema);
export default School;
