import mongoose from 'mongoose';

const variantSchema = mongoose.Schema({
  size: { type: String, required: true },
  price: { type: Number, default: 0 },
  countInStock: { type: Number, default: 0 },
  openingQty: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  alertOnQty: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  isActive: { type: Boolean, rquired: true, default: false },
});

// Schema for custom measurement fields (for flexibility)
const customFieldSchema = mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String },
});

// Schema for each row in the size guide table
const measurementRowSchema = mongoose.Schema({
  size: { type: String, required: true },      // e.g., "26", "S", "Medium"
  chest: { type: String },                      // e.g., "36-38"
  waist: { type: String },                      // e.g., "28-30"
  length: { type: String },                     // e.g., "27"
  shoulder: { type: String },                   // e.g., "15"
  hip: { type: String },                        // e.g., "38-40"
  inseam: { type: String },                     // For trousers
  age: { type: String },                        // e.g., "6-8 years"
  height: { type: String },                     // e.g., "120-130 cm"
  customFields: [customFieldSchema],            // For additional measurements
});

// Schema for the entire size guide table
const sizeGuideTableSchema = mongoose.Schema({
  title: { type: String, default: 'Size Guide' },
  measurementUnit: { 
    type: String, 
    enum: ['cm', 'inches', 'both'], 
    default: 'inches' 
  },
  instructions: { type: String },               // How to measure text
  instructionImage: { type: String },           // How to measure diagram URL
  fitType: { type: String },                    // e.g., "Slim Fit", "Regular Fit"
  rows: [measurementRowSchema],
  // Columns to display (admin can enable/disable based on product type)
  visibleColumns: [{
    type: String,
    enum: ['size', 'chest', 'waist', 'length', 'shoulder', 'hip', 'inseam', 'age', 'height']
  }],
});

const productTypesSchema = mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
  },
  image: { type: String, required: true },
  sizeGuide: { type: String, required: true },  // Legacy: Image URL (kept for backward compatibility)
  sizeChart: { type: String, required: true },  // Legacy: Image URL (kept for backward compatibility)
  imageFour: { type: String },
  variants: [variantSchema],
  isActive: { type: Boolean, rquired: true, default: false },
  // New: Structured size guide table data
  sizeGuideTable: sizeGuideTableSchema,
});

const ProductType = mongoose.model('ProductType', productTypesSchema);

export default ProductType;

