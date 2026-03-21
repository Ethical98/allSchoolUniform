import mongoose from 'mongoose';

const quotationCounterSchema = mongoose.Schema({
  _id: { type: String, required: true },
  prefix: { type: String, required: true },
  seq: { type: Number, default: 0 },
  financialYear: { type: String, required: true },
});

const QuotationCounter = mongoose.model('QuotationCounter', quotationCounterSchema);

export default QuotationCounter;
