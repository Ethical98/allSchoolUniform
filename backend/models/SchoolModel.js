import mongoose from 'mongoose';

const schoolSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  orders: {
    type: Number,
  },
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  website: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  country: {
    type: String,
    required: true,
    default: 'India',
  },

  isActive: {
    type: Boolean,
    default: false,
    rquired: true,
  },
});
const School = mongoose.model('School', schoolSchema);
export default School;
