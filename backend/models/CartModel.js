import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    username: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    cartItems: [
      {
        name: {
          type: String,
          required: true,
        },
        image: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          default: 0,
        },
        countInStock: {
          type: Number,
          required: true,
          default: 0,
        },
        qty: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
        tax: {
          type: Number,
        },
        disc: {
          type: Number,
        },
        size: {
          type: String,
          required: true,
        },
        index: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// ========================================
// Database Indexes for Query Performance
// ========================================

cartSchema.index({ user: 1 }); // Fast cart lookup by user

const Cart = mongoose.model('cart', cartSchema);

export default Cart;
