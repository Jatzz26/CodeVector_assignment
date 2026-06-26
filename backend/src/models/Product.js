const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    category: { type: String, required: true },
    price:    { type: Number, required: true },
  },
  {
    // Mongoose automatically manages createdAt and updatedAt
    timestamps: true,
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────
//
// 1. Compound index for cursor-based pagination (newest first).
//    The query "give me items older than cursor" becomes an index range scan
//    instead of a full collection scan.
//
productSchema.index({ createdAt: -1, _id: -1 });

//
// 2. Compound index for category-filtered cursor pagination.
//    MongoDB will use this when a category filter is applied.
//
productSchema.index({ category: 1, createdAt: -1, _id: -1 });

module.exports = mongoose.model('Product', productSchema);
