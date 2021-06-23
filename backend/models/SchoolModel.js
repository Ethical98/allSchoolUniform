import mongoose from 'mongoose';

const schoolSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Order',
  },
  schoolName: {
    type: String,
    required: true,
  },
  schoolAddress: {
    type: String,
    required: true,
  },
  schoolLogo: {
    type: String,
    required: true,
  },
  schoolContact: {
    type: Number,
    required: true,
  },
  schoolImage: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
    rquired: true,
  },
});
const School = mongoose.model('School', schoolSchema);
export default School;
