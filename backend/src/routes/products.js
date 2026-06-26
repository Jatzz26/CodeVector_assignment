const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');

// ─── GET /api/products ────────────────────────────────────────────────────
//
// Query params:
//   category  (optional)  — filter by category name
//   cursor    (optional)  — base64-encoded JSON { createdAt, _id } of the
//                           last item on the previous page
//   limit     (optional)  — items per page (default 20, max 100)
//
// How cursor-based pagination keeps data stable:
//   Every page query asks "give me items OLDER than the cursor".
//   Because new products arrive with NEWER timestamps they land before
//   the cursor, so they never push existing items down and cause duplicates
//   or gaps.
//
router.get('/', async (req, res) => {
  try {
    const limit    = Math.min(parseInt(req.query.limit) || 20, 100);
    const category = req.query.category || null;
    const cursor   = req.query.cursor   || null;

    // Build the base filter
    const filter = {};
    if (category) {
      filter.category = category;
    }

    // If a cursor was supplied, add the range condition.
    // We want items where:
    //   createdAt < cursor.createdAt
    //   OR (createdAt === cursor.createdAt AND _id < cursor._id)
    if (cursor) {
      const { createdAt: cursorDate, _id: cursorId } = decodeCursor(cursor);
      filter.$or = [
        { createdAt: { $lt: new Date(cursorDate) } },
        { createdAt: new Date(cursorDate), _id: { $lt: cursorId } },
      ];
    }

    // Fetch one extra item to know whether a next page exists
    const products = await Product.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNextPage = products.length > limit;
    if (hasNextPage) products.pop(); // remove the extra item

    // Build the cursor from the last item on this page
    const nextCursor = hasNextPage
      ? encodeCursor({ createdAt: products[products.length - 1].createdAt, _id: products[products.length - 1]._id })
      : null;

    // Total count (respects category filter)
    const total = await Product.countDocuments(category ? { category } : {});

    res.json({ products, nextCursor, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/products/categories ─────────────────────────────────────────
// Returns the list of distinct categories (used to populate the filter UI)
router.get('/categories', async (_req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories.sort());
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/products ────────────────────────────────────────────────────
// Creates a new product.
// Body (JSON): { name, category, price }
router.post('/', async (req, res) => {
  try {
    const { name, category, price } = req.body;

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!category || typeof category !== 'string' || category.trim() === '') {
      return res.status(400).json({ error: 'category is required' });
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'price must be a non-negative number' });
    }

    const product = await Product.create({
      name:     name.trim(),
      category: category.trim(),
      price:    Math.round(parsedPrice * 100) / 100,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Cursor helpers ────────────────────────────────────────────────────────
function encodeCursor(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function decodeCursor(str) {
  return JSON.parse(Buffer.from(str, 'base64url').toString('utf8'));
}

module.exports = router;
