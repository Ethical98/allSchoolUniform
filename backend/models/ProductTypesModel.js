import mongoose from 'mongoose';

const variantSchema = mongoose.Schema({
  size: { type: String, required: true },
  price: { type: Number, default: 0 },
  countInStock: { type: Number, default: 0 },
  openingQty: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  alertOnQty: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
});

const productTypesSchema = mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
  },
  image: { type: String, required: true },
  sizeGuide: { type: String, required: true },
  sizeChart: { type: String, required: true },
  imageFour: { type: String },
  variants: [variantSchema],
});

const ProductType = mongoose.model('ProductType', productTypesSchema);

export default ProductType;
