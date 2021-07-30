import mongoose from 'mongoose';

const schoolSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,

    ref: 'Order',
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
    type: Number,
    required: true,
  },
  // schoolImage: {
  //   type: String,
  //   required: true,
  // },
  disabled: {
    type: Boolean,
    default: false,
    rquired: true,
  },
});
const School = mongoose.model('School', schoolSchema);
export default School;
