import asyncHandler from 'express-async-handler';
import Product from '../models/ProductModel.js';

// @desc Fetch all Products
// @route GET /api/products
// @access Public
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({});
  res.json(products);
});

// @desc Fetch Single Products
// @route GET /api/products/:id
// @access Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc Fetch Product Price
// @route GET /api/products/price/:id
// @access Public
const getItemPrice = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.json(product.price);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

export { getProducts, getProductById, getItemPrice };
