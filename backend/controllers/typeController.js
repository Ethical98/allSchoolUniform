import asyncHandler from 'express-async-handler';
import ProductType from '../models/ProductTypesModel.js';
import paginate from '../utils/pagination.js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// @desc Get product Types
// @route GET /api/types
// @access Private/Admin
const getTypes = asyncHandler(async (req, res) => {
  const productType = await ProductType.find().select('type isActive');

  if (productType) {
    res.json(productType);
  } else {
    res.status(404);
    throw new Error('Product Type not found');
  }
});

// @desc Get Images
// @route GET /api/types/:type/images
// @access Public
const getTypeImages = asyncHandler(async (req, res) => {
  const productType = await ProductType.findOne({
    type: req.params.type,
  }).select('image sizeChart sizeGuide');

  if (productType) {
    res.status(200).json(productType);
  } else {
    res.status(404);
    throw new Error('Type Not Found');
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
  const { typeName, variants, sizeGuide, sizeChart, typeImage, isActive } =
    req.body;
  const productType = new ProductType({
    type: typeName,
    variants,
    sizeGuide,
    sizeChart,
    image: typeImage,
    isActive,
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
  const { typeName, variants, typeImage, sizeGuide, sizeChart, isActive } =
    req.body;

  if (productType) {
    productType.type = typeName || productType.type;
    productType.variants = [...variants] || productType.variants;
    productType.image = typeImage || productType.image;
    productType.sizeChart = sizeChart || productType.sizeChart;
    productType.sizeGuide = sizeGuide || productType.sizeGuide;
    productType.isActive = isActive;
    const updatedType = await productType.save();

    res.status(200).json(updatedType);
  } else {
    res.status(404);
    throw new Error('Type Not Found');
  }
});

// @desc  Get Product Type Images
// @route GET /api/types/images
// @access Public
const getSizeGuideImages = asyncHandler(async (req, res) => {
  const __dirname = path.resolve();
  const imagesPerPage = 12;
  const currentPage = req.query.page || 1;
  const imagesFolder = path.join(__dirname, '/uploads/sizeguides/');

  const images = [];

  const files = fs.readdirSync(imagesFolder);

  files.sort(
    (a, b) =>
      fs.statSync(imagesFolder + b).mtime.getTime() -
      fs.statSync(imagesFolder + a).mtime.getTime()
  );

  files.forEach((file) => {
    images.push({ url: `\\uploads\\sizeguides\\${file}`, name: file });
  });

  const { currentImages, pages } = paginate(currentPage, imagesPerPage, images);

  res.send({ images: currentImages, pages: pages });
});

// @desc Upload Type Images
// @route POST /api/types/images
// @access Public
const uploadSizeGuideImages = asyncHandler(async (req, res) => {
  if (req.file) {
    const newFilename = `${
      req.file.originalname.split('.')[0]
    }-${Date.now()}${path.extname(req.file.originalname)}`;

    await sharp(req.file.buffer)
      .resize({ width: 300, height: 300 })
      .toFile('uploads/sizeguides/resized-' + newFilename);

    res.send(`/uploads/sizeguides/resized-${newFilename}`);
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
  getTypeImages,
  getSizeGuideImages,
  uploadSizeGuideImages,
};
