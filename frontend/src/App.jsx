import { useState, useEffect, useCallback } from 'react';
import ProductList    from './components/ProductList.jsx';
import AddProductModal from './components/AddProductModal.jsx';

// API is always relative — in dev, Vite proxies /api/* to localhost:5000
// In production, Express serves both frontend and backend from the same port
const API = '/api/products';
const PAGE_SIZE = 20;

export default function App() {
  const [categories, setCategories] = useState([]);
  const [category,   setCategory]   = useState('');

  const [products,   setProducts]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [nextCursor, setNextCursor] = useState(undefined);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [showModal,  setShowModal]  = useState(false);

  // ── Fetch a page of products ──────────────────────────────────────────
  const fetchProducts = useCallback(async (cursor, cat, reset) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: PAGE_SIZE });
      if (cat)    params.set('category', cat);
      if (cursor) params.set('cursor', cursor);

      const res  = await fetch(`${API}?${params}`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      setProducts((prev) => reset ? data.products : [...prev, ...data.products]);
      setNextCursor(data.nextCursor);
      setTotal(data.total);
    } catch (err) {
      setError('Failed to load products. Is the backend running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load categories once ───────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  // ── Reset + fetch when category changes ───────────────────────────────
  useEffect(() => {
    setProducts([]);
    setNextCursor(undefined);
    fetchProducts(null, category, true);
  }, [category, fetchProducts]);

  const handleLoadMore = () => {
    if (nextCursor && !loading) fetchProducts(nextCursor, category, false);
  };

  // Called when a new product is successfully created via the modal.
  // Reset to page 1 so we always show exactly 20 products, with the
  // new product at the top (it has the newest createdAt timestamp).
  const handleProductAdded = () => {
    setProducts([]);
    setNextCursor(undefined);
    fetchProducts(null, category, true);
  };

  const fmtCount = (n) => n.toLocaleString('en-US'); // e.g. 200,000

  return (
    <>
      {/* ── Sticky Header ─────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-inner">

          {/* Left: hamburger + title */}
          <div className="header-left">
            <button className="hamburger" aria-label="Menu">
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <rect width="18" height="2" rx="1" fill="currentColor"/>
                <rect y="6" width="18" height="2" rx="1" fill="currentColor"/>
                <rect y="12" width="18" height="2" rx="1" fill="currentColor"/>
              </svg>
            </button>
            <span className="site-title">Product Browser</span>
          </div>

          {/* Showing X of Y */}
          <p className="header-meta">
            Showing <strong>{fmtCount(products.length)}</strong> of{' '}
            <strong>{fmtCount(total)}</strong> products
          </p>

          <div className="header-spacer" />

          {/* Right: + Add Product button + filter */}
          <div className="header-right">
            <button className="btn-add" onClick={() => setShowModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Product
            </button>

            <span className="filter-label">Filter by category:</span>
            <select
              id="category-filter"
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

          </div>

        </div>
      </header>

      {/* ── Product Grid ──────────────────────────────────────────────── */}
      <main className="main">
        {error && <div className="status" style={{ color: '#c0392b' }}>{error}</div>}
        <ProductList
          products={products}
          loading={loading}
          nextCursor={nextCursor}
          onLoadMore={handleLoadMore}
        />
      </main>

      {/* Add Product Modal */}
      {showModal && (
        <AddProductModal
          onClose={() => setShowModal(false)}
          onAdded={handleProductAdded}
        />
      )}
    </>
  );
}
