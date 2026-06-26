/**
 * seed.js — Bulk-inserts 200,000 products into MongoDB
 *
 * Strategy: insert in 20 parallel batches of 10,000 using insertMany().
 * This is orders of magnitude faster than a loop of individual inserts.
 *
 * Usage:
 *   node scripts/seed.js
 *
 * Optional env var:
 *   MONGO_URI=mongodb://localhost:27017/productbrowser
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env'), override: true });

const mongoose = require('mongoose');
const Product  = require('../src/models/Product');

// ─── Config ────────────────────────────────────────────────────────────────
const TOTAL      = 200_000;
const BATCH_SIZE = 10_000;          // documents per insertMany call
const BATCHES    = TOTAL / BATCH_SIZE; // 20 batches

// ─── Data pools ────────────────────────────────────────────────────────────
const CATEGORIES = [
  'Electronics', 'Clothing', 'Books', 'Sports',
  'Home & Garden', 'Beauty', 'Toys', 'Food & Drinks',
];

const ADJECTIVES = [
  'Premium', 'Deluxe', 'Compact', 'Ultra', 'Smart', 'Pro',
  'Eco', 'Vintage', 'Modern', 'Classic', 'Portable', 'Heavy-Duty',
  'Wireless', 'Organic', 'Slim', 'Rugged',
];

const NOUNS = {
  'Electronics':    ['Headphones', 'Laptop', 'Keyboard', 'Monitor', 'Tablet', 'Charger', 'Speaker', 'Webcam'],
  'Clothing':       ['Jacket', 'T-Shirt', 'Jeans', 'Sneakers', 'Hat', 'Hoodie', 'Dress', 'Scarf'],
  'Books':          ['Novel', 'Cookbook', 'Guide', 'Memoir', 'Atlas', 'Anthology', 'Manual', 'Journal'],
  'Sports':         ['Yoga Mat', 'Dumbbell', 'Bicycle', 'Tennis Racket', 'Football', 'Helmet', 'Gloves', 'Backpack'],
  'Home & Garden':  ['Lamp', 'Blender', 'Pillow', 'Curtain', 'Planter', 'Shelf', 'Rug', 'Mirror'],
  'Beauty':         ['Serum', 'Moisturizer', 'Lipstick', 'Perfume', 'Shampoo', 'Face Mask', 'Sunscreen', 'Toner'],
  'Toys':           ['Puzzle', 'Action Figure', 'Board Game', 'Doll', 'Remote Car', 'Building Set', 'Stuffed Animal', 'Kite'],
  'Food & Drinks':  ['Coffee Blend', 'Protein Bar', 'Tea Set', 'Olive Oil', 'Honey Jar', 'Granola', 'Spice Kit', 'Juice Pack'],
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPrice() {
  // prices between $0.99 and $999.99
  return Math.round((Math.random() * 999 + 0.99) * 100) / 100;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generates an array of `count` product plain objects.
 * createdAt is spread randomly over the last 2 years so pagination looks realistic.
 */
function generateBatch(count) {
  const now      = new Date();
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

  return Array.from({ length: count }, () => {
    const category  = pick(CATEGORIES);
    const adjective = pick(ADJECTIVES);
    const noun      = pick(NOUNS[category]);
    const createdAt = randomDate(twoYearsAgo, now);

    return {
      name:      `${adjective} ${noun}`,
      category,
      price:     randomPrice(),
      createdAt,
      updatedAt: createdAt, // start equal; can diverge via updates
    };
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function seed() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/productbrowser';

  console.log('Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log('Connected.\n');

  // Wipe existing data so re-runs are idempotent
  const existing = await Product.countDocuments();
  if (existing > 0) {
    console.log(`Dropping ${existing.toLocaleString()} existing products…`);
    await Product.deleteMany({});
  }

  console.log(`Seeding ${TOTAL.toLocaleString()} products in ${BATCHES} parallel batches of ${BATCH_SIZE.toLocaleString()} …`);
  const t0 = Date.now();

  // Build all batches at once and fire them in parallel.
  // insertMany with ordered:false lets MongoDB optimise the writes
  // and not bail on a single document error.
  const batchPromises = Array.from({ length: BATCHES }, () =>
    Product.insertMany(generateBatch(BATCH_SIZE), { ordered: false })
  );

  await Promise.all(batchPromises);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
  const final   = await Product.countDocuments();

  console.log(`\nDone! Inserted ${final.toLocaleString()} products in ${elapsed}s`);
  console.log(`(~${Math.round(TOTAL / elapsed).toLocaleString()} docs/second)`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
