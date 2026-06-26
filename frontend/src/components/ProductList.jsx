import ProductCard from './ProductCard.jsx';

export default function ProductList({ products, loading, nextCursor, onLoadMore }) {
  if (loading && products.length === 0) {
    return (
      <div className="status">
        <div className="spinner" />
        Loading products…
      </div>
    );
  }

  if (!loading && products.length === 0) {
    return <div className="status">No products found.</div>;
  }

  return (
    <>
      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>

      <div className="load-more-wrap">
        {nextCursor ? (
          <button
            id="load-more-btn"
            className="btn-load-more"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Load More Products'}
          </button>
        ) : (
          products.length > 0 && (
            <p className="end-msg">You've reached the end — all products loaded.</p>
          )
        )}
      </div>
    </>
  );
}
