import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },

  {
    timestamps: true,
  }
);

const sizeSchema = mongoose.Schema({
  size: { type: String, required: true },
  price: { type: Number, required: true },
  countInStock: { type: Number, required: true },
  openingQty: { type: Number },
  discount: { type: Number },
  alertOnQty: { type: Number },
  tax: { type: Number },
  outOfStock: { type: Boolean, default: false },
});

const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    SKU: { type: String, rquired: true, unique: true },
    outOfStock: { type: Boolean, default: false },
    season: { type: String, required: true },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: false,
    },
    image: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    SEOKeywords: {
      type: String,
    },
    class: [{ type: String, required: true }],
    reviews: [reviewSchema],
    schoolName: [{ type: String, required: true }],
    size: [sizeSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    featuredOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ========================================
// Database Indexes for Query Performance
// ========================================

// Single field indexes for common filters
productSchema.index({ schoolName: 1 });
productSchema.index({ type: 1 });
productSchema.index({ name: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdAt: -1 });

// Featured products index (for homepage)
productSchema.index({ isFeatured: -1, featuredOrder: 1 });

// Compound indexes for common query patterns
productSchema.index({ isActive: 1, schoolName: 1 });
productSchema.index({ isActive: 1, type: 1 });
productSchema.index({ isActive: 1, class: 1 });

// Text index for search functionality
productSchema.index({ name: 'text', schoolName: 'text', SEOKeywords: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;
