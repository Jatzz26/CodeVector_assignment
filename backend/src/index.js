require('dotenv').config({ override: true });

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const connectDB  = require('./db');
const products   = require('./routes/products');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── API Routes ───────────────────────────────────────────────────────────
app.use('/api/products', products);

// ─── Serve React frontend in production ───────────────────────────────────
// The frontend is built into frontend/dist by the Render build command.
// In development this block is never reached (Vite dev server handles it).
const frontendDist = path.join(__dirname, '../../frontend/dist');

if (process.env.NODE_ENV === 'production') {
  // Serve static assets (JS, CSS, images)
  app.use(express.static(frontendDist));

  // SPA fallback — any non-API route returns index.html
  // so React Router can handle client-side navigation
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => res.json({ message: 'Product Browser API is running' }));
}

// ─── Start ────────────────────────────────────────────────────────────────
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

