import mongoose from 'mongoose';

const variantSchema = mongoose.Schema({
  size: { type: String, required: true },
  price: { type: Number, required: true },
  countInStock: { type: Number, required: true },
  openingQty: { type: Number },
  discount: { type: Number },
  alertOnQty: { type: Number },
  tax: { type: Number },
});

const productTypesSchema = mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
  },
  variants: [variantSchema],
});

const ProductType = mongoose.model('ProductType', productTypesSchema);

export default ProductType;
