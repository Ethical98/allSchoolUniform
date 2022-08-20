import mongoose from 'mongoose';


const classSchema = mongoose.Schema({
  class: { type: String, required: true },
  isActive: { type: Boolean, required: true, default: false },
});

const Class = mongoose.model('Class', classSchema);
export default Class;
