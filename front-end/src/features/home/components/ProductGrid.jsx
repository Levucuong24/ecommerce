import { useNavigate } from "react-router-dom";
import { formatPrice } from "../utils";
import "./ProductCard.css";

function ProductGrid({ products }) {
  const navigate = useNavigate();

  if (!products || products.length === 0) {
    return (
      <section className="product-panel">
        <div className="section-heading">
          <h2>Sản phẩm</h2>
        </div>
        <div className="empty-state">
          <img src="/images/logochuacosanpham.png" alt="Chưa có sản phẩm" className="empty-cart-img" />
          <p>Chưa có sản phẩm nào.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="product-panel">
      <div className="section-heading">
        <h2>Sản phẩm</h2>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <article
            key={product.id}
            className="product-card"
            style={{ cursor: "pointer" }}
            onClick={() => product.id && navigate(`/product/${product.id}`)}
          >
            <div className="product-thumb">
              {product.image ? (
                <img src={product.image} alt={product.name} className="product-image" />
              ) : (
                <div className="product-image-placeholder" />
              )}
              <span className="product-badge">{product.badge}</span>
            </div>
            <div className="product-body">
              <h3>{product.name}</h3>
              <div className="product-category-tag">{product.categoryName}</div>
              <strong>{formatPrice(product.price)}đ</strong>
              <div className="product-meta">
                <span>{product.sold}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ProductGrid;
