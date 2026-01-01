import asyncHandler from 'express-async-handler';
import Homepage from '../models/HomepageModel.js';
import Product from '../models/ProductModel.js';
import User from '../models/UserModel.js';
import School from '../models/SchoolModel.js';
import ProductType from '../models/ProductTypesModel.js';
import { normalizeUrl, normalizeProductsImages } from '../utils/normalizeUrl.js';

// @desc Get Carousel Images
// @route GET /api/home/carousel
// @access Public
const getCarouselImages = asyncHandler(async (req, res) => {
  const carouselImages = await Homepage.findOne().select('homePageCarousel');

  if (carouselImages) {
    // Normalize image URLs
    const normalized = {
      ...carouselImages.toObject(),
      homePageCarousel: carouselImages.homePageCarousel.map((item) => ({
        ...item.toObject ? item.toObject() : item,
        image: normalizeUrl(item.image),
      })),
    };
    res.json(normalized);
  } else {
    res.status(404);
    throw new Error('No Carousel Images');
  }
});

// @desc Update Carousel Images
// @route PUT /api/home/carousel
// @access Private/Admin
const updateCarouselImages = asyncHandler(async (req, res) => {
  const { newData } = req.body;

  await Homepage.updateOne(
    { 'homePageCarousel._id': newData._id },
    {
      $set: {
        'homePageCarousel.$.image': newData.image,
        'homePageCarousel.$.isActive': newData.isActive,
        'homePageCarousel.$.displayOrder': newData.displayOrder,
      },
    }
  );
  res.status(200);
  res.json({ message: 'Updated Image' });
});

// @desc DELETE Carousel Image
// @route DELETE /api/home/carousel
// @access Private/Admin
const deleteCarouselImages = asyncHandler(async (req, res) => {
  const images = await Homepage.findOne();

  if (images.homePageCarousel.some((x) => x._id == req.params.id)) {
    await Homepage.updateOne(
      {},
      { $pull: { homePageCarousel: { _id: req.params.id } } }
    );
    res.status(200);
    res.json({ message: 'Image Deleted' });
  } else {
    res.status(404);
    throw new Error('No Carousel Images');
  }
});

// @desc ADD Carousel Image
// @route POST /api/home/carousel
// @access Private/Admin
const addCarouselImages = asyncHandler(async (req, res) => {
  const { image, isActive, displayOrder } = req.body;

  const carouselImages = await Homepage.findOne();

  if (carouselImages) {
    carouselImages.homePageCarousel = [
      ...carouselImages.homePageCarousel,
      { image: image, displayOrder: displayOrder, isActive: isActive },
    ];
    const addImage = await carouselImages.save();
    res.status(200);
    res.json(addImage.homePageCarousel);
  }
});

// @desc Get Homepage Statistics
// @route GET /api/home/statistics
// @access Public
const getStatistics = asyncHandler(async (req, res) => {
  const homepage = await Homepage.findOne().select('statistics -_id');
  const products = await Product.countDocuments();
  const users = await User.countDocuments();
  const schools = await School.countDocuments();
  if (homepage) {
    const stats = homepage.statistics.map((x) => ({
      _id: x._id,
      totalParents: x.totalHappyParents + users,
      totalSchools: x.totalSchools + schools,
      totalProducts: x.totalProducts + products,
      isActive: x.isActive,
    }));

    res.json(stats);
  } else {
    res.status(404);
    throw new Error('Not Found');
  }
});

// @desc Update Homepage Statistics
// @route PUT /api/home/statistics
// @access Private/Admin
const updateStatistics = asyncHandler(async (req, res) => {
  const { newData } = req.body;

  await Homepage.updateOne(
    { 'statistics._id': newData._id },
    {
      $set: {
        'statistics.$.totalHappyParents': newData.totalParents,
        'statistics.$.isActive': newData.isActive,
        'statistics.$.totalSchools': newData.totalSchools,
        'statistics.$.totalProducts': newData.totalProducts,
      },
    }
  );
  res.status(200);
  res.json({ message: 'Updated Stats' });
});

// @desc Get Header Background
// @route GET /api/home/header
// @access Public
const getHeaderBackground = asyncHandler(async (req, res) => {
  const homepage = await Homepage.findOne().select('headerBackground -_id');

  if (homepage) {
    const headerBackground = [
      {
        image: normalizeUrl(homepage.headerBackground.image),
        isActive: homepage.headerBackground.isActive,
      },
    ];

    res.json(headerBackground);
  } else {
    res.status(404);
    throw new Error('Not Found');
  }
});

// @desc Update Header Background
// @route PUT /api/home/header
// @access Private/Admin
const updateHeaderBackground = asyncHandler(async (req, res) => {
  const { newData } = req.body;

  const homepage = await Homepage.findOne();

  if (homepage) {
    homepage.headerBackground.image = newData.image;
    homepage.headerBackground.isActive = newData.isActive;
    await homepage.save();
    res.json({ message: 'Update header background' });
  } else {
    res.status(404);
    throw new Error('Not Found');
  }
});

// @desc Get Announcements
// @route GET /api/home/announcement
// @access Public
const getAnnouncement = asyncHandler(async (req, res) => {
  const homepage = await Homepage.findOne().select('announcements -_id');

  if (homepage) {
    // Normalize image URLs
    const normalized = homepage.announcements.map((item) => ({
      ...item.toObject ? item.toObject() : item,
      image: normalizeUrl(item.image),
    }));
    res.json(normalized);
  } else {
    res.status(404);
    throw new Error('Not Found');
  }
});

// @desc Update Announcements
// @route PUT /api/home/announcement
// @access Private/Admin
const updateAnnouncement = asyncHandler(async (req, res) => {
  const { newData } = req.body;
  const homepage = await Homepage.findOne();

  await Homepage.updateOne(
    { 'announcements._id': newData._id },
    {
      $set: {
        'announcements.$.image': newData.image,
        'announcements.$.isActive': newData.isActive,
        'announcements.$.displayOrder': newData.displayOrder,
      },
    }
  );
  if (homepage) {
    homepage.announcements.image = newData.image;
    homepage.announcements.isActive = newData.isActive;
    homepage.announcements.displayOrder = newData.displayOrder;
  }
  res.status(200);
  res.json({ message: 'Updated' });
});

// @desc DELETE Announcement
// @route DELETE /api/home/announcement
// @access Private/Admin
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const homepage = await Homepage.findOne();

  if (homepage.announcements.some((x) => x._id == req.params.id)) {
    await Homepage.updateOne(
      {},
      { $pull: { announcements: { _id: req.params.id } } }
    );
    res.status(200);
    res.json({ message: 'Announcement Deleted' });
  } else {
    res.status(404);
    throw new Error('Not Found');
  }
});

// @desc ADD Announcement
// @route POST /api/home/announcement
// @access Private/Admin
const addAnnouncement = asyncHandler(async (req, res) => {
  const { image, isActive, displayOrder } = req.body;

  const homepage = await Homepage.findOne();

  if (homepage) {
    homepage.announcements = [
      ...homepage.announcements,
      { image: image, isActive: isActive, displayOrder: displayOrder },
    ];
    const addedAnnouncement = await homepage.save();
    res.status(200);
    res.json(addedAnnouncement.announcements);
  }
});

// @desc Get Complete Homepage Config (Consolidated endpoint)
// @route GET /api/home/config
// @access Public

// In-memory cache for homepage config (5 minute TTL)
let homePageCache = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getHomePageConfig = asyncHandler(async (req, res) => {
  const now = Date.now();

  // Return cached data if valid
  if (homePageCache && now < cacheExpiry) {
    // Add cache hit header for debugging
    res.set('X-Cache', 'HIT');
    res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.json(homePageCache);
  }

  // Fetch all homepage data in parallel for optimal performance
  const [homepage, products, users, schools, featuredSchools, featuredProducts, newArrivals, categories] = await Promise.all([
    Homepage.findOne().select('homePageCarousel statistics announcements headerBackground'),
    Product.countDocuments(),
    User.countDocuments(),
    School.countDocuments(),
    School.find({ isFeatured: true, isActive: true })
      .select('name logo city state')
      .sort({ featuredOrder: 'asc', name: 'asc' })
      .limit(8)
      .lean(),
    Product.find({ isFeatured: true, isActive: true })
      .select('name image size rating numReviews brand')
      .sort({ featuredOrder: 'asc', name: 'asc' })
      .limit(10)
      .lean(),
    Product.find({ isActive: true })
      .select('name image size rating numReviews brand createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    ProductType.find({ isActive: true })
      .select('type image')
      .lean(),
  ]);

  // Normalize carousel images
  const carouselImages = homepage?.homePageCarousel?.map((item) => ({
    ...item.toObject ? item.toObject() : item,
    image: normalizeUrl(item.image),
  })) || [];

  // Calculate statistics with dynamic counts
  const statistics = homepage?.statistics?.map((x) => ({
    _id: x._id,
    totalParents: x.totalHappyParents + users,
    totalSchools: x.totalSchools + schools,
    totalProducts: x.totalProducts + products,
    isActive: x.isActive,
  })) || [];

  // Normalize announcement images
  const announcements = homepage?.announcements?.map((item) => ({
    ...item.toObject ? item.toObject() : item,
    image: normalizeUrl(item.image),
  })) || [];

  // Normalize category images
  const normalizedCategories = categories.map((cat) => ({
    ...cat,
    image: normalizeUrl(cat.image),
  }));

  const response = {
    success: true,
    data: {
      carouselImages,
      statistics,
      announcements,
      schools: featuredSchools,
      featuredProducts: normalizeProductsImages(featuredProducts),
      newArrivals: normalizeProductsImages(newArrivals),
      categories: normalizedCategories,
    },
  };

  // Update cache
  homePageCache = response;
  cacheExpiry = now + CACHE_TTL;

  // Add cache miss header for debugging
  res.set('X-Cache', 'MISS');
  res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.json(response);
});

export {
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  addAnnouncement,
  updateHeaderBackground,
  getHeaderBackground,
  getCarouselImages,
  updateCarouselImages,
  deleteCarouselImages,
  addCarouselImages,
  getStatistics,
  updateStatistics,
  getHomePageConfig,
};
