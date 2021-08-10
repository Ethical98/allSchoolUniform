import mongoose from 'mongoose';

const homePageSchmea = mongoose.Schema({
  headerBackground: {
    type: String,
    required: true,
  },
  homePageCarousel: [{ type: String, required: true }],
  announcement: { type: String },
});
