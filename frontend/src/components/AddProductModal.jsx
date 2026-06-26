import { useState } from 'react';

const CATEGORIES = [
  'Beauty', 'Books', 'Clothing', 'Electronics',
  'Food & Drinks', 'Home & Garden', 'Sports', 'Toys',
];

export default function AddProductModal({ onClose, onAdded }) {
  const [form,    setForm]    = useState({ name: '', category: '', price: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim())     return setError('Product name is required.');
    if (!form.category)        return setError('Please select a category.');
    if (form.price === '')     return setError('Price is required.');
    if (isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0)
      return setError('Price must be a valid positive number.');

    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:     form.name.trim(),
          category: form.category,
          price:    parseFloat(form.price),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');

      onAdded();  // trigger a fresh page-1 fetch in App
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* backdrop */
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h2 className="modal-title">Add New Product</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="p-name">Product Name</label>
            <input
              id="p-name"
              name="name"
              type="text"
              className="form-input"
              placeholder="e.g. Premium Wireless Headphones"
              value={form.name}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="p-category">Category</label>
            <select
              id="p-category"
              name="category"
              className="form-input form-select"
              value={form.category}
              onChange={handleChange}
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="p-price">Price (USD)</label>
            <div className="input-prefix-wrap">
              <span className="input-prefix">$</span>
              <input
                id="p-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                className="form-input form-input-prefixed"
                placeholder="0.00"
                value={form.price}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Adding…' : 'Add Product'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
