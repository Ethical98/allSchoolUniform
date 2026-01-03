import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import colors from 'colors';
import connectDB from '../config/db.js';
import School from '../models/SchoolModel.js';

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

// Fields to trim in School documents
const FIELDS_TO_TRIM = ['name', 'address', 'city', 'state', 'country', 'description', 'contact', 'email', 'website'];

/**
 * Main function to trim whitespaces from school documents
 */
const trimSchoolWhitespaces = async () => {
  try {
    // Connect to MongoDB using existing config
    await connectDB();

    if (isDryRun) {
      console.log('\n🔍 DRY-RUN MODE: No changes will be saved to the database\n');
    }

    // Get all schools
    const schools = await School.find({});
    console.log(`🏫 Found ${schools.length} schools to process\n`);

    let wouldUpdateCount = 0;
    let skippedCount = 0;

    for (const school of schools) {
      let hasChanges = false;
      const changes = [];

      // Check and normalize each field
      for (const field of FIELDS_TO_TRIM) {
        const originalValue = school[field];
        if (originalValue && typeof originalValue === 'string') {
          const normalizedValue = normalizeWhitespace(originalValue);
          if (originalValue !== normalizedValue) {
            hasChanges = true;
            changes.push(`  📝 ${field}: "${originalValue}" → "${normalizedValue}"`);
            if (!isDryRun) {
              school[field] = normalizedValue;
            }
          }
        }
      }

      // Log changes and save if not dry-run
      if (hasChanges) {
        console.log(`\n🏫 School: ${school.name} (ID: ${school._id})`);
        changes.forEach((change) => console.log(change));

        if (!isDryRun) {
          await school.save();
        }
        wouldUpdateCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('\n========== Summary ==========');
    if (isDryRun) {
      console.log(`🔍 DRY-RUN MODE - No changes were saved`);
      console.log(`📝 Would update: ${wouldUpdateCount} schools`);
    } else {
      console.log(`✅ Updated: ${wouldUpdateCount} schools`);
    }
    console.log(`⏭️  Skipped: ${skippedCount} schools (no changes needed)`);
    console.log(`📊 Total: ${schools.length} schools processed`);

    if (isDryRun && wouldUpdateCount > 0) {
      console.log('\n💡 To apply these changes, run without --dry-run flag:');
      console.log('   node scripts/trimSchoolWhitespaces.js');
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
trimSchoolWhitespaces();
