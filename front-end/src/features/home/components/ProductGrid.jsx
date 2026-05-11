import { formatPrice } from "../utils";

function ProductGrid({ products }) {
  return (
    <section className="product-panel">
      <div className="section-heading">
        <h2>Cac san pham</h2>
      </div>

      <div className="product-grid">
        {products.map((product) => (
          <article key={product.name} className="product-card">
            <div className="product-thumb">
              <img src={product.image} alt={product.name} className="product-image" />
              <span className="product-badge">{product.badge}</span>
            </div>
            <div className="product-body">
              <h3>{product.name}</h3>
              <strong>{formatPrice(product.price)}d</strong>
              <div className="product-meta">
                <span>{product.sold}</span>
                <span>San pham</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ProductGrid;
