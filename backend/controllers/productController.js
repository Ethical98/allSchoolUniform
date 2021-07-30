import asyncHandler from 'express-async-handler';
import Product from '../models/ProductModel.js';
// import Class from '../models/ClassModel.js';
// import ProductType from '../models/ProductTypesModel.js';

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

  if (category && season && standard) {
    const product = await Product.find({
      category,
      season,
    });
    const filteredProductsByStandard = product.filter((x) =>
      x.class.some((y) => standard.includes(y))
    );
    if (filteredProductsByStandard.length === 0) {
      throw new Error('No Products Found!!');
    } else {
      res.json(filteredProductsByStandard);
    }
  } else if (category && season) {
    const product = await Product.find({
      category,
      season,
    });
    if (product.length === 0) {
      throw new Error('No Products Found!!');
    } else {
      res.json(product);
    }
  } else if (category && standard) {
    const product = await Product.find({
      category,
    });
    const filteredProductsByStandard = product.filter((x) =>
      x.class.some((y) => standard.includes(y))
    );
    if (filteredProductsByStandard.length === 0) {
      throw new Error('No Products Found!!');
    } else {
      res.json(filteredProductsByStandard);
    }
  } else if (season && standard) {
    const product = await Product.find({
      season,
    });
    const filteredProductsByStandard = product.filter((x) =>
      x.class.some((y) => standard.includes(y))
    );
    if (filteredProductsByStandard.length === 0) {
      throw new Error('No Products Found!!');
    } else {
      res.json(filteredProductsByStandard);
    }
  } else if (season) {
    const product = await Product.find({
      season,
    });
    if (product.length === 0) {
      throw new Error('No Products Found!!');
    } else {
      res.json(product);
    }
  } else if (category) {
    const product = await Product.find({
      category,
    });
    if (product.length === 0) {
      throw new Error('No Products Found!!');
    } else {
      res.json(product);
    }
  } else if (standard) {
    const product = await Product.find();
    const filteredProductsByStandard = product.filter((x) =>
      x.class.some((y) => standard.includes(y))
    );
    if (filteredProductsByStandard.length === 0) {
      throw new Error('No Products Found!!');
    } else {
      res.json(filteredProductsByStandard);
    }
  } else {
    const product = await Product.find();
    res.json(product);
  }
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
    class: req.body.standard,
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

export {
  getProducts,
  getProductById,
  getItemPrice,
  getProductByName,
  filterProducts,
  deleteProduct,
  createProduct,
  updateProduct,
};
