import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import colors from 'colors';
import connectDB from '../config/db.js';
import Product from '../models/ProductModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (parent of backend)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Check for dry-run mode
const isDryRun = process.argv.includes('--dry-run');

/**
 * Trims leading/trailing whitespace and collapses multiple spaces between words to single spaces.
 * @param {string} str - The input string
 * @returns {string} - The trimmed and normalized string
 */
const normalizeWhitespace = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.trim().replace(/\s+/g, ' ');
};

/**
 * Main function to trim whitespaces from product names and school names
 */
const trimWhitespaces = async () => {
  try {
    // Connect to MongoDB using existing config
    await connectDB();

    if (isDryRun) {
      console.log('\n🔍 DRY-RUN MODE: No changes will be saved to the database\n');
    }

    // Get all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products to process\n`);

    let wouldUpdateCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      let hasChanges = false;
      const changes = [];

      // Check and normalize product name
      const originalName = product.name;
      const normalizedName = normalizeWhitespace(originalName);
      if (originalName !== normalizedName) {
        hasChanges = true;
        changes.push(`  📝 Name: "${originalName}" → "${normalizedName}"`);
        if (!isDryRun) {
          product.name = normalizedName;
        }
      }

      // Check and normalize school names array
      if (product.schoolName && Array.isArray(product.schoolName)) {
        const normalizedSchoolNames = product.schoolName.map((name) => normalizeWhitespace(name));

        // Check if any school name was changed
        product.schoolName.forEach((name, index) => {
          if (name !== normalizedSchoolNames[index]) {
            hasChanges = true;
            changes.push(`  🏫 School: "${name}" → "${normalizedSchoolNames[index]}"`);
          }
        });

        if (!isDryRun && changes.length > 0) {
          product.schoolName = normalizedSchoolNames;
        }
      }

      // Log changes and save if not dry-run
      if (hasChanges) {
        console.log(`\n📦 Product: ${originalName} (ID: ${product._id})`);
        changes.forEach((change) => console.log(change));

        if (!isDryRun) {
          await product.save();
        }
        wouldUpdateCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('\n========== Summary ==========');
    if (isDryRun) {
      console.log(`🔍 DRY-RUN MODE - No changes were saved`);
      console.log(`📝 Would update: ${wouldUpdateCount} products`);
    } else {
      console.log(`✅ Updated: ${wouldUpdateCount} products`);
    }
    console.log(`⏭️  Skipped: ${skippedCount} products (no changes needed)`);
    console.log(`📊 Total: ${products.length} products processed`);

    if (isDryRun && wouldUpdateCount > 0) {
      console.log('\n💡 To apply these changes, run without --dry-run flag:');
      console.log('   node scripts/trimWhitespaces.js');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the script
trimWhitespaces();
