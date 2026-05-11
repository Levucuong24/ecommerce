function CategoryList({ categories }) {
  return (
    <section className="category-strip">
      <div className="section-heading">
        <h2>Danh muc</h2>
        <span>Xem tat ca</span>
      </div>
      <div className="category-grid">
        {categories.map((category) => (
          <div key={category} className="category-chip">
            {category}
          </div>
        ))}
      </div>
    </section>
  );
}

export default CategoryList;
