import mongoose from 'mongoose';

const schoolSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  schoolName: {
    type: String,
    required: true,
  },
  schoolAddress: {
    type: String,
    required: true,
  },
});
const School = mongoose.model('School', schoolSchema);
export default School;
