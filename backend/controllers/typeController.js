import asyncHandler from 'express-async-handler';
import ProductType from '../models/ProductTypesModel.js';

// @desc Get product Types
// @route GET /api/types
// @access Private/Admin
const getTypes = asyncHandler(async (req, res) => {
  const productType = await ProductType.find().select('type');

  if (productType) {
    res.json(productType);
  } else {
    res.status(404);
    throw new Error('Product Type not found');
  }
});

// @desc Get product Sizes
// @route GET /api/types/:type/sizes
// @access Private/Admin
const getSizes = asyncHandler(async (req, res) => {
  const productType = await ProductType.findOne({
    type: req.params.type,
  }).select('variants');

  if (productType) {
    res.json(productType);
  } else {
    res.status(404);
    throw new Error('Product Type not found');
  }
});

export { getSizes, getTypes };
