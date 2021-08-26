import mongoose from 'mongoose';

const homePageSchmea = mongoose.Schema({
  headerBackground: {
    image: { type: String, required: true },
    isActive: { type: Boolean, required: true, default: false },
  },
  homePageCarousel: [
    {
      image: { type: String, required: true },
      isActive: { type: Boolean, required: true, default: false },
      displayOrder: { type: Number, required: true, unique: true },
    },
  ],
  announcements: [
    {
      image: { type: String },
      isActive: { type: Boolean, default: false },
      displayOrder: { type: Number, unique: true },
    },
  ],
  statistics: [
    {
      totalParents: { type: Number, default: 18921 },
      totalSchools: { type: Number, default: 645 },
      totalProducts: { type: Number, default: 387 },
      totalHappyParents: { type: Number, default: 15650 },
      isActive: { type: Boolean, default: true },
    },
  ],
});

const Homepage = mongoose.model('Homepage', homePageSchmea);

export default Homepage;
