import 'colors';
import Product from '../models/ProductModel.js';
import connectDB from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const seedInventoryFields = async () => {
  try {
    await connectDB();
    console.log('Starting inventory fields migration...');

    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    let totalProducts = 0;
    let totalVariants = 0;

    for (const product of products) {
      let hasChanged = false;

      for (const variant of product.size) {
        // Seed quantityOnHand from countInStock if not yet set or still at default 0
        if (!variant.quantityOnHand && variant.countInStock > 0) {
          variant.quantityOnHand = variant.countInStock;
          variant.committed = variant.committed || 0;
          variant.damaged = variant.damaged || 0;
          variant.safetyStock = variant.safetyStock || 0;
          hasChanged = true;
          totalVariants++;
        }
      }

      if (hasChanged) {
        await product.save();
        totalProducts++;
      }
    }

    console.log(
      `Migration complete: ${totalProducts} products, ${totalVariants} variants updated`
    );
    console.log('quantityOnHand initialized from countInStock for all variants');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

seedInventoryFields();
