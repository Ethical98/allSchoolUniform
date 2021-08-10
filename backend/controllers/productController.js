import asyncHandler from 'express-async-handler';
import Product from '../models/ProductModel.js';
// import Class from '../models/ClassModel.js';
// import ProductType from '../models/ProductTypesModel.js';

// @desc Fetch all Products
// @route GET /api/products
// @access Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 10;
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
          $regex: req.query.category,
          $options: 'i',
        },
      }
    : {};

  const seasonKeyword = req.query.season
    ? {
        season: {
          $regex: req.query.season,
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

  const keyword3 = classes
    ? {
        class: {
          $regex: classes,
          $options: 'i',
        },
      }
    : {};

  const pageSize = 2;
  const page = Number(req.query.pageNumber) || 1;

  const count = await Product.countDocuments({
    $and: [{ ...keyword1 }, { ...keyword2 }, { ...keyword3 }],
  });

  const products = await Product.find({
    $and: [{ ...keyword1 }, { ...keyword2 }, { ...keyword3 }],
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
    schoolName,
    image,
    description,
    brand,
    category,
    season,
    type,
    size,
    standard,
  } = req.body;

  const product = new Product({
    name,
    user: req.user._id,
    schoolName,
    image,
    description,
    brand,
    category,
    season,
    type,
    size,
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
    standard,
    schoolName,
    image,
    description,
    category,
    brand,
    season,
    size,
    type,
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
};
