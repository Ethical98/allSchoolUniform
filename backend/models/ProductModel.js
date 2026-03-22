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
  lastRestockedAt: { type: Date }, // When this size was last restocked
  costPrice: { type: Number }, // Purchase cost (for profit tracking)
  quantityOnHand: { type: Number, default: 0 }, // Total physical stock in warehouse
  committed: { type: Number, default: 0 }, // Reserved for confirmed unshipped orders
  damaged: { type: Number, default: 0 }, // Damaged / QC hold / write-off
  safetyStock: { type: Number, default: 0 }, // Buffer held back from sale by admin
  maxOrderQty: { type: Number }, // Per-variant cap on qty dropdown (optional)
});

const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    SKU: { type: String, required: true, unique: true },
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
    displayOrder: {
      type: Number,
      default: 0,
      index: true, // For efficient sorting queries
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

// Display order index for UI sorting
productSchema.index({ isActive: 1, displayOrder: -1, name: 1 });

// Text index for search functionality
productSchema.index({ name: 'text', schoolName: 'text', SEOKeywords: 'text' });

// Track which denormalized fields changed before save
productSchema.pre('save', function (next) {
  if (!this.isNew) {
    this._nameModified = this.isModified('name');
    this._skuModified = this.isModified('SKU');
  }
  next();
});

// Sync denormalized productName/SKU in StockMovement and StockAlert after save
productSchema.post('save', async function () {
  if (this._nameModified || this._skuModified) {
    const update = {};
    if (this._nameModified) update.productName = this.name;
    if (this._skuModified) update.SKU = this.SKU;

    try {
      const StockMovement = mongoose.model('StockMovement');
      const StockAlert = mongoose.model('StockAlert');
      await Promise.all([
        StockMovement.updateMany({ product: this._id }, { $set: update }),
        StockAlert.updateMany({ product: this._id }, { $set: update }),
      ]);
    } catch (err) {
      // Log but don't fail — sync is best-effort
      console.error(`[Product Sync] Failed to sync denormalized fields for ${this._id}:`, err.message);
    }
  }
});

const Product = mongoose.model('Product', productSchema);

export default Product;
