import asyncHandler from 'express-async-handler';
import Product from '../models/ProductModel.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import paginate from '../utils/pagination.js';

// @desc Fetch all Products
// @route GET /api/products
// @access Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 12;
  const page = Number(req.query.pageNumber) || 1;

  const searchKeyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const schoolKeyword = req.query.keyword
    ? {
        schoolName: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const categoryKeyword = req.query.category
    ? {
        category: {
          $regex: `${req.query.category}|unisex`,
          $options: 'i',
        },
      }
    : {};

  const seasonKeyword = req.query.season
    ? {
        season: {
          $regex: `${req.query.season}|all season`,
          $options: 'i',
        },
      }
    : {};

  const classesKeyword = req.query.standard
    ? {
        class: {
          $regex: req.query.standard,
          $options: 'i',
        },
      }
    : {};

  const school = req.query.school
    ? {
        schoolName: {
          $regex: req.query.school,
          $options: 'i',
        },
      }
    : {};

  const count = await Product.countDocuments({
    $and: [
      { $or: [{ ...searchKeyword }, { ...schoolKeyword }] },
      {
        $and: [
          // { ...unisexCategory },
          { ...categoryKeyword },
          { ...seasonKeyword },
          { ...classesKeyword },
        ],
      },
      {
        ...school,
      },
    ],
  });

  const products = await Product.find({
    $and: [
      { $or: [{ ...searchKeyword }, { ...schoolKeyword }] },
      {
        $and: [
          // { ...unisexCategory },

          { ...categoryKeyword },
          { ...seasonKeyword },
          { ...classesKeyword },
        ],
      },
      {
        ...school,
      },
    ],
  })
    .sort({
      name: 'asc',
    })
    .limit(pageSize)
    .skip(pageSize * (page - 1));
  if (products.length === 0) {
    throw new Error('No Products Found');
  } else {
    res.json({ products, page, pages: Math.ceil(count / pageSize) });
  }
});

// @desc Fetch Single Product
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
// @route GET /api/products/:name
// @access Public
const getProductByName = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ name: req.params.name });

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

// @desc Filter Products
// @route POST /api/products/filter
// @access Public
const filterProducts = asyncHandler(async (req, res) => {
  const { category, season, standard } = req.body;
  const classes = standard ? standard.join('|') : '';
  const keyword1 = category
    ? {
        category: {
          $regex: category,
          $options: 'i',
        },
      }
    : {};

  const keyword2 = season
    ? {
        season: {
          $regex: season,
          $options: 'i',
        },
      }
    : {};

  const unisexCategory = {
    category: {
      $regex: 'Unisex',
      $options: 'i',
    },
  };

  const keyword3 = classes
    ? {
        class: {
          $regex: classes,
          $options: 'i',
        },
      }
    : {};

  const allSeason = {
    season: {
      $regex: 'All Season',
      $options: 'i',
    },
  };

  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const count = await Product.countDocuments({
    $and: [
      // { ...keyword2 },
      // { ...keyword3 },
      { ...unisexCategory },
      { ...keyword1 },
      // { ...allSeason },
    ],
  });

  const products = await Product.find({
    $and: [
      { ...unisexCategory },
      { ...keyword1 },
      // { ...keyword2 },
      // { ...keyword3 },

      // { ...allSeason },
    ],
  })
    .sort({
      name: 'asc',
    })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize) });
});

// @desc Delete a product
// @route DELETE /api/products/:id
// @access Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.remove();
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc Create a product
// @route POST /api/products/
// @access Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    SKU,
    schoolName,
    image,
    description,
    brand,
    category,
    season,
    type,
    size,
    standard,
    isActive,
    SEOKeywords,
  } = req.body;

  const product = new Product({
    name,
    SKU,
    user: req.user._id,
    schoolName,
    image,
    description,
    brand,
    category,
    season,
    type,
    size,
    isActive,
    SEOKeywords,
    class: standard,
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc Update a product
// @route PUT /api/products/:id
// @access Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    SKU,
    standard,
    schoolName,
    image,
    description,
    category,
    brand,
    season,
    size,
    type,
    isActive,
    SEOKeywords,
  } = req.body;

  const product = await Product.findById(req.params.id);
  if (product) {
    product.type = type;
    product.name = name;
    product.class = [...standard];
    product.schoolName = [...schoolName];
    product.image = image;
    product.description = description;
    product.category = category;
    product.brand = brand;
    product.season = season;
    product.size = [...size];
    product.isActive = isActive;
    product.SKU = SKU;
    product.SEOKeywords = SEOKeywords;

    const updatedProduct = await product.save();
    res.status(201).json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not Found');
  }
});

// @desc Create new review
// @route POST /api/products/:id/reviews
// @access Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);
  if (product) {
    const alreadyReviewed = await product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }
    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;
    await product.save();
    res.status(201).json({ message: 'Review Added' });
  } else {
    res.status(404);
    throw new Error('Product not Found');
  }
});

// @desc Get top rated products
// @route POST /api/products/top
// @access Public
const getTopProducts = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);
  if (product) {
    const alreadyReviewed = await product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }
    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;
    await product.save();
    res.status(201).json({ message: 'Review Added' });
  } else {
    res.status(404);
    throw new Error('Product not Found');
  }
});

// @desc  Get Product Images
// @route GET /api/products/images
// @access Public
const getProductImages = asyncHandler(async (req, res) => {
  const __dirname = path.resolve();
  const imagesPerPage = 12;
  const currentPage = req.query.page || 1;
  const imagesFolder = path.join(__dirname, '/uploads/products/');

  const images = [];

  const files = fs.readdirSync(imagesFolder);

  files.sort(
    (a, b) =>
      fs.statSync(imagesFolder + b).mtime.getTime() -
      fs.statSync(imagesFolder + a).mtime.getTime()
  );

  files.forEach((file) => {
    images.push({ url: `\\uploads\\products\\${file}`, name: file });
  });

  const { currentImages, pages } = paginate(currentPage, imagesPerPage, images);

  res.send({ images: currentImages, pages: pages });
});

// @desc Upload Product Images
// @route POST /api/products/images
// @access Public
const uploadProductImages = asyncHandler(async (req, res) => {
  if (req.file) {
    const newFilename = `${
      req.file.originalname.split('.')[0]
    }-${Date.now()}${path.extname(req.file.originalname)}`;

    await sharp(req.file.buffer)
      .resize({ width: 640, height: 640 })
      .toFile('uploads/products/resized-' + newFilename);

    res.send(`/uploads/products/resized-${newFilename}`);
  }
});

export {
  getProducts,
  getProductById,
  getItemPrice,
  getProductByName,
  filterProducts,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getProductImages,
  uploadProductImages,
};
