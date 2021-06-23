import mongoose from 'mongoose';

const shirtSizeSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
  size: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    rquired: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  openingQty: {
    type: Number,
    required: true,
  },
  chest: {
    type: Number,
    required: true,
  },
  shoulder: {
    type: Number,
    required: true,
  },
});

const ShirtSize = mongoose.model('ShirtSize', shirtSizeSchema);

export { shirtSizeSchema, ShirtSize };
