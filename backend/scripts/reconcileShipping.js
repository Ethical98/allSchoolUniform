import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent asu directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

import connectDB from '../config/db.js';
import Order from '../models/OrderModel.js';
import { reconcileOrder } from '../modules/shipping/utils/reconcileShipping.js';

const run = async () => {
  await connectDB();
  console.log('✅ MongoDB Connected\n');

  const candidates = await Order.find({
    $or: [
      { 'shipping.isShipped': true, 'tracking.isDelivered': false },
      { 'shipping.status': 'AWB_FAILED' },
      { 'shipping.status': 'AWB_ASSIGNED', 'shipping.awbCode': { $in: [null, ''] } },
    ],
  });

  console.log(`Found ${candidates.length} candidate orders to reconcile.\n`);
  const summary = { healed: 0, unchanged: 0, 'no-track': 0, error: 0 };

  for (const order of candidates) {
    const res = await reconcileOrder(order, { sendEmails: false });
    summary[res.outcome] = (summary[res.outcome] || 0) + 1;
    const tag = res.outcome === 'healed' ? '✅' : res.outcome === 'error' ? '❌' : '·';
    console.log(`${tag} ${res.orderId}: ${res.outcome}${res.error ? ` (${res.error})` : ''}`);
  }

  console.log('\n=== Summary ===');
  console.log(summary);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => {
  console.error('Reconcile failed:', e);
  process.exit(1);
});
