import asyncHandler from 'express-async-handler';
import Homepage from '../models/HomepageModel.js';

// @desc Get Carousel Images
// @route GET /api/home/carousel
// @access Public
const getCarouselImages = asyncHandler(async (req, res) => {
  const carouselImages = await Homepage.findOne().select(
    'homePageCarousel -_id'
  );

  if (carouselImages) {
    res.json(carouselImages);
  } else {
    res.status(404);
    throw new Error('School List empty');
  }
});

export { getCarouselImages };
