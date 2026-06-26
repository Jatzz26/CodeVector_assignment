// CategoryFilter — renders the category <select> dropdown
export default function CategoryFilter({ categories, selected, onChange }) {
  return (
    <div className="controls">
      <label htmlFor="category-filter">Filter by category:</label>
      <select
        id="category-filter"
        className="select"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>
  );
}
