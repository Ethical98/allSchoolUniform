import mongoose from 'mongoose';

// const IdSchema = mongoose.Schema({
//   _id: { type: String, required: true },
//   seq: { type: Number, default: 0 },
// });

const classSchema = mongoose.Schema({
  class: { type: String, required: true },
  isActive: { type: Boolean, required: true, default: false },
});

// classSchema.pre('save', async (next) => {
//   const doc = this;
//   const id = await IdSchema.findByIdAndUpdate(
//     { _id: '_id' },
//     { $inc: { seq: 1 } },
//     { new: true, upsert: true }
//   );

//   doc._id = id.seq;
//   next();
// });
const Class = mongoose.model('Class', classSchema);
export default Class;
