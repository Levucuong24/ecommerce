function CategoryList({ categories }) {
  if (!categories || categories.length === 0) {
    return (
      <section className="category-strip">
        <div className="section-heading">
          <h2>Danh mục</h2>
        </div>
        <div className="empty-state">
          <p>Chưa có danh mục nào.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="category-strip">
      <div className="section-heading">
        <h2>Danh mục</h2>
        <span>Xem tất cả</span>
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
