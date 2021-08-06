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

// @desc Get product Types and sizes
// @route GET /api/types/all
// @access Private/Admin
const getProductTypes = asyncHandler(async (req, res) => {
  const productTypes = await ProductType.find();

  if (productTypes) {
    res.json(productTypes);
  } else {
    res.status(404);
    throw new Error('Product Type empty');
  }
});

// @desc Get Type Details
// @route GET /api/types/:id
// @access Private/Admin
const getTypeDetails = asyncHandler(async (req, res) => {
  const type = await ProductType.findById(req.params.id);

  if (type) {
    res.json(type);
  } else {
    res.status(404);
    throw new Error('Type Not Found');
  }
});

// @desc Create Type
// @route POST /api/types
// @access Private/Admin
const createType = asyncHandler(async (req, res) => {
  const { typeName, variants, sizeGuide, sizeChart, typeImage } = req.body;
  const productType = new ProductType({
    type: typeName,
    variants,
    sizeGuide,
    sizeChart,
    image: typeImage,
  });
  const createdType = await productType.save();
  res.status(201).json(createdType);
});

// @desc Delete Type
// @route DELETE /api/types/:id
// @access Private/Admin
const deleteType = asyncHandler(async (req, res) => {
  const productType = await ProductType.findById(req.params.id);

  if (productType) {
    await productType.remove();
    res.json({ message: 'Type removed' });
  } else {
    res.status(404);
    throw new Error('Type Not Found');
  }
});

// @desc Update Type
// @route PUT /api/types/:id
// @access Private/Admin
const updateType = asyncHandler(async (req, res) => {
  const productType = await ProductType.findById(req.params.id);
  const { typeName, variants, typeImage, sizeGuide, sizeChart } = req.body;

  if (productType) {
    productType.type = typeName || productType.type;
    productType.variants = [...variants] || productType.variants;
    productType.image = typeImage || productType.image;
    productType.sizeChart = sizeChart || productType.sizeChart;
    productType.sizeGuide = sizeGuide || productType.sizeGuide;
    const updatedType = await productType.save();
    res.status(200).json(updatedType);
  } else {
    res.status(404);
    throw new Error('Type Not Found');
  }
});

export {
  getProductTypes,
  getSizes,
  getTypes,
  createType,
  updateType,
  deleteType,
  getTypeDetails,
};
