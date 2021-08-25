import asyncHandler from 'express-async-handler';
import Homepage from '../models/HomepageModel.js';
import Product from '../models/ProductModel.js';
import User from '../models/UserModel.js';
import School from '../models/SchoolModel.js';

// @desc Get Carousel Images
// @route GET /api/home/carousel
// @access Public
const getCarouselImages = asyncHandler(async (req, res) => {
  const carouselImages = await Homepage.findOne().select('homePageCarousel');

  if (carouselImages) {
    res.json(carouselImages);
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
  // const { id } = req.body;
  console.log(req.params.id);
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
        image: homepage.headerBackground.image,
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
  const announcement = await Homepage.findOne().select('announcements');

  if (announcement) {
    const announcements = [
      {
        image: announcement.image,
        isActive: announcement.isActive,
      },
    ];
    res.json(announcements);
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

  if (homepage) {
    homepage.announcement.image = newData.image;
    homepage.announcement.isActive = newData.isActive;
  }
  res.status(200);
  res.json({ message: 'Updated' });
});

// @desc DELETE Announcement
// @route DELETE /api/home/announcement
// @access Private/Admin
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const homepage = await Homepage.findOne();

  if (homepage.announcement.some((x) => x._id == req.params.id)) {
    await Homepage.updateOne(
      {},
      { $pull: { announcement: { _id: req.params.id } } }
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
  const { image, isActive } = req.body;

  const homepage = await Homepage.findOne();

  if (homepage) {
    homepage.announcement = [
      ...homepage.announcement,
      { image: image, isActive: isActive },
    ];
    const addedAnnouncement = await homepage.save();
    res.status(200);
    res.json(addedAnnouncement.announcement);
  }
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
};
