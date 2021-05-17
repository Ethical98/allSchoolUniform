import mongoose from 'mongoose';

const sizeSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  size: {
    type: Integer,
    required: true,
  },
  price: {
    type: Integer,
    rquired: true,
  },
  quantity: {
    type: Integer,
    required: true,
  },
});

const Size = mongoose.model('Size', sizeSchema);

export default Size;
