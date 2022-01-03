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
});

const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    SKU: { type: String, rquired: true, unique: true },

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
    // gender: {
    //   type: String,
    //   required: true,
    // },
    image: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    // supplier: {
    //   type: String,
    //   required: true,
    // },
    // brandLogo: {
    //   type: String,
    //   required: true,
    // },
    // displayOrder: {
    //   type: Number,
    //   required: true,
    // },
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
    // productCode: {
    //   type: String,
    //   required: true,
    // },
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
    // seoDescription: {
    //   type: String,
    // },
    // seoKeywords: {
    //   type: String,
    // },
    // mafatLalProduct: {
    //   type: Boolean,
    //   default: false,
    // },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
