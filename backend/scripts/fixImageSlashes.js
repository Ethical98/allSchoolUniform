import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import colors from 'colors';
import connectDB from '../config/db.js';
import Product from '../models/ProductModel.js';
import School from '../models/SchoolModel.js';
import ProductType from '../models/ProductTypesModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (parent of backend)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Check for dry-run mode
const isDryRun = process.argv.includes('--dry-run');

/**
 * Normalize URL path - replace backslashes with forward slashes
 * @param {string} url - The URL path to normalize
 * @returns {string} - Normalized path with forward slashes
 */
const normalizeSlashes = (url) => {
  if (!url || typeof url !== 'string') return url;
  return url.replace(/\\/g, '/');
};

/**
 * Main function to fix image path slashes in database
 */
const fixImageSlashes = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    if (isDryRun) {
      console.log('\n🔍 DRY-RUN MODE: No changes will be saved to the database\n');
    }

    let totalUpdated = 0;

    // ====== Fix Products ======
    console.log('📦 Processing Products...');
    const products = await Product.find({});
    let productUpdates = 0;

    for (const product of products) {
      let hasChanges = false;
      const changes = [];

      // Check image field
      if (product.image && product.image.includes('\\')) {
        const normalized = normalizeSlashes(product.image);
        changes.push(`  📷 image: "${product.image}" → "${normalized}"`);
        if (!isDryRun) product.image = normalized;
        hasChanges = true;
      }

      if (hasChanges) {
        console.log(`\n📦 Product: ${product.name} (ID: ${product._id})`);
        changes.forEach((c) => console.log(c));
        if (!isDryRun) await product.save();
        productUpdates++;
      }
    }

    // ====== Fix Schools ======
    console.log('\n🏫 Processing Schools...');
    const schools = await School.find({});
    let schoolUpdates = 0;

    for (const school of schools) {
      let hasChanges = false;
      const changes = [];

      // Check logo field
      if (school.logo && school.logo.includes('\\')) {
        const normalized = normalizeSlashes(school.logo);
        changes.push(`  📷 logo: "${school.logo}" → "${normalized}"`);
        if (!isDryRun) school.logo = normalized;
        hasChanges = true;
      }

      if (hasChanges) {
        console.log(`\n🏫 School: ${school.name} (ID: ${school._id})`);
        changes.forEach((c) => console.log(c));
        if (!isDryRun) await school.save();
        schoolUpdates++;
      }
    }

    // ====== Fix Product Types ======
    console.log('\n📂 Processing Product Types...');
    const types = await ProductType.find({});
    let typeUpdates = 0;

    for (const type of types) {
      let hasChanges = false;
      const changes = [];

      // Check image, sizeChart, sizeGuide fields
      if (type.image && type.image.includes('\\')) {
        const normalized = normalizeSlashes(type.image);
        changes.push(`  📷 image: "${type.image}" → "${normalized}"`);
        if (!isDryRun) type.image = normalized;
        hasChanges = true;
      }
      if (type.sizeChart && type.sizeChart.includes('\\')) {
        const normalized = normalizeSlashes(type.sizeChart);
        changes.push(`  📏 sizeChart: "${type.sizeChart}" → "${normalized}"`);
        if (!isDryRun) type.sizeChart = normalized;
        hasChanges = true;
      }
      if (type.sizeGuide && type.sizeGuide.includes('\\')) {
        const normalized = normalizeSlashes(type.sizeGuide);
        changes.push(`  📐 sizeGuide: "${type.sizeGuide}" → "${normalized}"`);
        if (!isDryRun) type.sizeGuide = normalized;
        hasChanges = true;
      }

      if (hasChanges) {
        console.log(`\n📂 Type: ${type.type} (ID: ${type._id})`);
        changes.forEach((c) => console.log(c));
        if (!isDryRun) await type.save();
        typeUpdates++;
      }
    }

    totalUpdated = productUpdates + schoolUpdates + typeUpdates;

    console.log('\n========== Summary ==========');
    if (isDryRun) {
      console.log(`🔍 DRY-RUN MODE - No changes were saved`);
      console.log(`📝 Would update:`);
    } else {
      console.log(`✅ Updated:`);
    }
    console.log(`   📦 ${productUpdates} products`);
    console.log(`   🏫 ${schoolUpdates} schools`);
    console.log(`   📂 ${typeUpdates} product types`);
    console.log(`   📊 Total: ${totalUpdated} documents`);

    if (isDryRun && totalUpdated > 0) {
      console.log('\n💡 To apply these changes, run without --dry-run flag:');
      console.log('   node scripts/fixImageSlashes.js');
    }

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
fixImageSlashes();
