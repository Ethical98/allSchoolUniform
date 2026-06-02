/**
 * Seeds asuDb_staging from asuDb (production).
 * Run with: node --env-file=.env.staging backend/scripts/seedStagingFromProd.js
 *
 * Collections copied: products, users, orders, schools, classes, producttypes,
 *                     homepages, returnrequests, shippinglogs, stockmovements,
 *                     stockalerts, billingconfigs, billcompanies, billquotations,
 *                     documenttemplates, returncounters, quotationcounters
 *
 * Safe to re-run: clears staging collections before inserting.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const STAGING_URI = process.env.MONGO_URI; // asuDb_staging (loaded via --env-file)
const PROD_URI = STAGING_URI.replace('asuDb_staging', 'asuDb');

// These users are copied with their original email intact and password overridden.
const PRESERVE_USERS = {
  'admin@example.com': '67890',
};

// Collections to copy. Add/remove as needed.
const COLLECTIONS = [
  'products',
  'users',
  'orders',
  'schools',
  'classes',
  'producttypes',
  'homepages',
  'returnrequests',
  'shippinglogs',
  'stockmovements',
  'stockalerts',
  'billingconfigs',
  'billcompanies',
  'billquotations',
  'documenttemplates',
  'returncounters',
  'quotationcounters',
  'invoicenumbers',
  'counters',
];

// Collections to anonymize (email/phone scrubbed)
const ANONYMIZE = new Set(['users']);

async function anonymizeDoc(collection, doc, hashedPasswords) {
  if (collection === 'users') {
    if (PRESERVE_USERS[doc.email] !== undefined) {
      // Keep email intact, override with known staging password
      return { ...doc, password: hashedPasswords[doc.email] };
    }
    return {
      ...doc,
      email: `staging_${doc._id}@test.local`,
      password: doc.password, // keep hashed — still valid for login
      phone: doc.phone ? '9999999999' : undefined,
    };
  }
  return doc;
}

async function main() {
  console.log('Connecting to prod and staging...');

  const opts = { useNewUrlParser: true, useUnifiedTopology: true };
  const prod = mongoose.createConnection(PROD_URI, opts);
  const staging = mongoose.createConnection(STAGING_URI, opts);

  await Promise.all([
    new Promise((res, rej) => prod.once('open', res).once('error', rej)),
    new Promise((res, rej) => staging.once('open', res).once('error', rej)),
  ]);

  console.log(`Prod DB:    ${prod.name}`);
  console.log(`Staging DB: ${staging.name}`);
  console.log('');

  // Pre-hash staging passwords for preserved users
  const hashedPasswords = {};
  for (const [email, plainPassword] of Object.entries(PRESERVE_USERS)) {
    const salt = await bcrypt.genSalt(10);
    hashedPasswords[email] = await bcrypt.hash(plainPassword, salt);
  }

  if (prod.name === staging.name) {
    console.error('ERROR: Prod and staging point to the same database. Aborting.');
    process.exit(1);
  }

  for (const col of COLLECTIONS) {
    const prodCol = prod.collection(col);
    const stagingCol = staging.collection(col);

    const count = await prodCol.countDocuments();
    if (count === 0) {
      console.log(`  ${col}: empty in prod, skipping`);
      continue;
    }

    const docs = await prodCol.find({}).toArray();
    const prepared = ANONYMIZE.has(col)
      ? await Promise.all(docs.map((d) => anonymizeDoc(col, d, hashedPasswords)))
      : docs;

    await stagingCol.deleteMany({});
    await stagingCol.insertMany(prepared, { ordered: false });

    console.log(`  ${col}: copied ${prepared.length} docs${ANONYMIZE.has(col) ? ' (anonymized)' : ''}`);
  }

  await prod.close();
  await staging.close();
  console.log('\nDone. Staging is seeded from prod.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
