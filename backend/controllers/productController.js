import asyncHandler from 'express-async-handler';
import Product from '../models/ProductModel.js';
import Order from '../models/OrderModel.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import paginate from '../utils/pagination.js';
import {
  normalizeUrl,
  normalizeProductImages,
  normalizeProductsImages,
} from '../utils/normalizeUrl.js';

// Helper: Escape special regex characters in a string
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Product name validation pattern and function
// Allowed: letters, numbers, spaces, hyphens, ampersands, apostrophes, commas, slashes, quotes
const PRODUCT_NAME_PATTERN = /^[a-zA-Z0-9\s\-&',\/"]+$/;

const validateProductName = (name) => {
  const errors = [];

  if (!name || typeof name !== 'string') {
    errors.push('Product name is required');
    return errors;
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 3) {
    errors.push('Product name must be at least 3 characters');
  }
  if (trimmedName.length > 100) {
    errors.push('Product name should not exceed 100 characters');
  }
  if (!PRODUCT_NAME_PATTERN.test(trimmedName)) {
    errors.push(
      'Product name contains invalid characters. Allowed: letters, numbers, spaces, hyphens, ampersands, apostrophes, commas, slashes, and quotes'
    );
  }
  if (name !== trimmedName) {
    errors.push('Product name should not have leading or trailing spaces');
  }
  if (/\s{2,}/.test(name)) {
    errors.push('Product name should not have multiple consecutive spaces');
  }

  return errors;
};

// @desc Fetch all Products
// @route GET /api/products
// @access Public
const getProducts = asyncHandler(async (req, res) => {
  // Pagination config
  const pageSize = Number(req.query.pageSize) || 12;
  const page = Math.max(1, Number(req.query.pageNumber) || 1);

  // Sorting config
  const sortField = req.query.sortBy || 'name';
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  // Build filters array
  const filters = [];

  // Keyword search (name or school)
  if (req.query.keyword) {
    const keyword = req.query.keyword.trim();
    filters.push({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { schoolName: { $regex: keyword, $options: 'i' } },
      ],
    });
  }

  // School filter (exact school match)
  if (req.query.school) {
    filters.push({
      schoolName: { $regex: req.query.school.trim(), $options: 'i' },
    });
  }

  // Category filter (includes 'unisex' to show common items)
  if (req.query.category) {
    filters.push({
      category: { $regex: `${req.query.category}|unisex`, $options: 'i' },
    });
  }

  // Season filter (includes 'all season' to show year-round items)
  if (req.query.season) {
    filters.push({
      season: { $regex: `${req.query.season}|all season`, $options: 'i' },
    });
  }

  // Class/Standard filter
  if (req.query.standard) {
    filters.push({
      class: { $regex: req.query.standard, $options: 'i' },
    });
  }

  // Type filter (e.g., Shirt, Trousers, Blazer)
  if (req.query.type) {
    filters.push({
      type: { $regex: req.query.type.trim(), $options: 'i' },
    });
  }

  // Only show active products by default (using $eq for better index usage)
  if (req.query.includeInactive !== 'true') {
    filters.push({ isActive: true });
  }

  // Build final match stage
  const matchStage = filters.length > 0 ? { $and: filters } : {};

  // Check if sorting by price - requires aggregation pipeline
  if (sortField === 'price') {
    // Use aggregation to calculate minPrice from size array for sorting
    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          // Calculate minimum price from size variants for sorting
          minPrice: { $min: '$size.price' },
        },
      },
      { $sort: { minPrice: sortOrder } },
      { $skip: pageSize * (page - 1) },
      { $limit: pageSize },
      {
        $project: {
          name: 1,
          image: 1,
          brand: 1,
          size: 1,
          schoolName: 1,
          category: 1,
          season: 1,
          class: 1,
          isActive: 1,
          createdAt: 1,
          type: 1,
          reviews: 1,
          numReviews: 1,
          displayOrder: 1,
        },
      },
    ];

    const [countResult, products] = await Promise.all([
      Product.countDocuments(matchStage),
      Product.aggregate(pipeline),
    ]);

    res.json({
      products: normalizeProductsImages(products),
      page,
      pages: Math.ceil(countResult / pageSize),
      pageSize,
      total: countResult,
    });
  } else {
    // Standard find query for non-price sorting
    // Default sort: displayOrder (descending - higher values first), then name (ascending)
    const validSortFields = ['name', 'createdAt'];
    let sortBy;
    if (validSortFields.includes(sortField)) {
      sortBy = { [sortField]: sortOrder };
    } else {
      // Default: sort by displayOrder (admin-controlled), then alphabetically by name
      sortBy = { displayOrder: -1, name: 1 };
    }

    const [count, products] = await Promise.all([
      Product.countDocuments(matchStage),
      Product.find(matchStage)
        .select(
          'name image brand size schoolName category season class isActive createdAt type reviews numReviews displayOrder'
        )
        .sort(sortBy)
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .lean(),
    ]);

    res.json({
      products: normalizeProductsImages(products),
      page,
      pages: Math.ceil(count / pageSize),
      pageSize,
      total: count,
    });
  }
});

// @desc Fetch Single Product
// @route GET /api/products/:id
// @access Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(normalizeProductImages(product.toObject()));
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc Fetch Product Price
// @route GET /api/products/:name
// @access Public
const getProductByName = asyncHandler(async (req, res) => {
  // Escape special regex characters to prevent issues with parentheses, brackets, etc.
  const escapedName = escapeRegex(req.params.name);

  const product = await Product.findOne({
    name: {
      $regex: escapedName,
      $options: 'i',
    },
  });

  if (product) {
    res.json(normalizeProductImages(product.toObject()));
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

  res.json({
    products: normalizeProductsImages(products),
    page,
    pages: Math.ceil(count / pageSize),
  });
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
    displayOrder,
  } = req.body;

  // Validate product name
  const nameErrors = validateProductName(name);
  if (nameErrors.length > 0) {
    res.status(400);
    throw new Error(nameErrors.join('. '));
  }

  // Auto-assign displayOrder if not provided
  // Uses sparse numbering: find max existing value and add 100
  let finalDisplayOrder = displayOrder;
  if (typeof displayOrder !== 'number') {
    const maxProduct = await Product.findOne({})
      .sort({ displayOrder: -1 })
      .select('displayOrder')
      .lean();
    finalDisplayOrder = (maxProduct?.displayOrder || 0) + 100;
  }

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
    displayOrder: finalDisplayOrder,
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
    outOfStock,
    displayOrder,
  } = req.body;

  // Validate product name
  const nameErrors = validateProductName(name);
  if (nameErrors.length > 0) {
    res.status(400);
    throw new Error(nameErrors.join('. '));
  }

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
    product.outOfStock = outOfStock;
    if (typeof displayOrder === 'number') {
      product.displayOrder = displayOrder;
    }

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
    images.push({ url: `/uploads/products/${file}`, name: file });
  });

  const { currentImages, pages } = paginate(
    currentPage,
    imagesPerPage,
    images
  );

  res.send({ images: currentImages, pages: pages });
});

// @desc Upload Product Images
// @route POST /api/products/images
// @access Public
const uploadProductImages = asyncHandler(async (req, res) => {
  if (req.file) {
    const newFilename = `${req.file.originalname.split('.')[0]
      }-${Date.now()}${path.extname(req.file.originalname)}`;

    // await sharp(req.file.buffer)
    //   .resize({ width: 640, height: 640 })
    //   .toFile('uploads/products/resized-' + newFilename);
    await sharp(req.file.buffer)
      .resize({
        fit: sharp.fit.contain,
      })
      .toFile('uploads/products/resized-' + newFilename);

    res.send(`/uploads/products/resized-${newFilename}`);
  }
});

// @desc Get Featured Products for Homepage
// @route GET /api/products/featured
// @access Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 20);

  // First try to get featured products
  let products = await Product.find({
    isFeatured: true,
    isActive: true,
  })
    .select('name image size rating numReviews brand')
    .sort({ featuredOrder: 'asc', name: 'asc' })
    .limit(limit)
    .lean();

  // Fallback: if no featured products, get most ordered products
  if (products.length === 0) {
    const mostOrdered = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          orderCount: { $sum: '$orderItems.qty' },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: limit },
    ]);

    const productIds = mostOrdered.map((item) => item._id);

    if (productIds.length > 0) {
      products = await Product.find({
        _id: { $in: productIds },
        isActive: true,
      })
        .select('name image size rating numReviews brand')
        .lean();
    }
  }

  res.json({
    success: true,
    count: products.length,
    data: normalizeProductsImages(products),
  });
});

// @desc Update Product Featured Status
// @route PUT /api/products/:id/featured
// @access Private/Admin
const updateFeaturedProduct = asyncHandler(async (req, res) => {
  const { isFeatured, featuredOrder } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (typeof isFeatured === 'boolean') {
    product.isFeatured = isFeatured;
  }
  if (typeof featuredOrder === 'number') {
    product.featuredOrder = featuredOrder;
  }

  const updatedProduct = await product.save();

  res.json({
    success: true,
    data: {
      _id: updatedProduct._id,
      name: updatedProduct.name,
      isFeatured: updatedProduct.isFeatured,
      featuredOrder: updatedProduct.featuredOrder,
    },
  });
});

// @desc Get New Arrivals for Homepage
// @route GET /api/products/new-arrivals
// @access Public
const getNewArrivals = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 20);

  const products = await Product.find({ isActive: true })
    .select('name image size rating numReviews brand createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({
    success: true,
    count: products.length,
    data: normalizeProductsImages(products),
  });
});

// @desc Get All Products Display Orders (Admin Helper)
// @route GET /api/products/admin/display-orders
// @access Private/Admin
const getDisplayOrders = asyncHandler(async (req, res) => {
  const products = await Product.find({})
    .select('_id name displayOrder isActive schoolName')
    .sort({ displayOrder: -1, name: 1 })
    .lean();

  // Calculate the next suggested displayOrder value
  const maxDisplayOrder = products.length > 0 ? products[0].displayOrder : 0;
  const nextSuggestedOrder = maxDisplayOrder + 100;

  res.json({
    success: true,
    count: products.length,
    nextSuggestedOrder,
    convention: {
      description: 'Use sparse numbering (100, 200, 300...) for display order. Higher values appear first.',
      examples: [
        'To place a product at top: use a value higher than current max',
        'To insert between 200 and 300: use 250',
        'Products with same displayOrder are sorted alphabetically by name',
      ],
    },
    products: products.map((p) => ({
      _id: p._id,
      name: p.name,
      displayOrder: p.displayOrder,
      isActive: p.isActive,
      schoolName: p.schoolName,
    })),
  });
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
  getFeaturedProducts,
  updateFeaturedProduct,
  getNewArrivals,
  getDisplayOrders,
};
