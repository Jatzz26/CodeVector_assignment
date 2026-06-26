// ProductCard — single product tile
export default function ProductCard({ product }) {
  const { name, category, price, createdAt } = product;

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  }).toUpperCase();

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style:    'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);

  return (
    <div className="card">
      <p className="card-name">{name}</p>
      <span className="card-badge">{category}</span>
      <div className="card-footer">
        <span className="card-price">{formattedPrice}</span>
        <span className="card-date">{formattedDate}</span>
      </div>
    </div>
  );
}
