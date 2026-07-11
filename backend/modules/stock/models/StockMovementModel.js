import mongoose from 'mongoose';

const stockMovementSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productName: { type: String, required: true }, // Denormalized for quick reads
    SKU: { type: String, required: true }, // Denormalized
    size: { type: String, required: true }, // Which size variant

    // Movement details
    type: {
      type: String,
      required: true,
      enum: [
        'PURCHASE', // Stock purchased from supplier
        'SALE', // Sold to customer (order placed)
        'SALE_CANCEL', // Order canceled, stock restored
        'RETURN', // Customer return
        'DAMAGE', // Damaged/expired goods
        'CORRECTION', // Manual correction (audit)
        'TRANSFER', // Between locations (future)
        'OPENING_STOCK', // Initial stock entry
        'QUOTATION_RESERVE', // Reserved for quotation/invoice
        'QUOTATION_RELEASE', // Released from quotation
        'SAFETY_STOCK', // Safety stock buffer adjustment
      ],
    },

    quantityChange: { type: Number, required: true }, // +ve for inflow, -ve for outflow
    previousStock: { type: Number, required: true }, // Stock before this movement
    newStock: { type: Number, required: true }, // Stock after this movement

    // Reference to related documents
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    orderId: { type: String }, // Human-readable order ID
    returnRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReturnRequest',
    },
    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillQuotation',
    },
    quotationNumber: { type: String }, // Human-readable quotation number

    // Metadata
    reason: { type: String }, // Free text reason
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByName: { type: String, required: true }, // Denormalized

    notes: { type: String },

    // Inventory bucket tracking
    bucketChanged: {
      type: String,
      enum: ['quantityOnHand', 'committed', 'damaged', 'safetyStock'],
    },
    onHandAfter: { type: Number },
  },
  { timestamps: true }
);

// Indexes for common queries
stockMovementSchema.index({ product: 1, size: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1, createdAt: -1 });
stockMovementSchema.index({ order: 1 });
stockMovementSchema.index({ quotation: 1 });
stockMovementSchema.index({ createdAt: -1 });
stockMovementSchema.index({ performedBy: 1 });

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

export default StockMovement;
