import { useNavigate } from "react-router-dom";
import { formatPrice } from "../utils";
import "./ProductCard.css";

function ProductGrid({ products }) {
  const navigate = useNavigate();

  if (!products || products.length === 0) {
    return (
      <section className="product-panel">
        <div className="section-heading">
          <h2>Gợi ý sản phẩm hôm nay</h2>
        </div>
        <div className="empty-state">
          <img src="/images/logochuacosanpham.png" alt="Chưa có sản phẩm" className="empty-cart-img" />
          <p>Chưa có sản phẩm nào.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="product-panel animate-fade">
      <div className="section-heading">
        <h2>Gợi Ý Sản Phẩm Hôm Nay</h2>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <article
            key={product.id}
            className="product-card"
            onClick={() => product.id && navigate(`/product/${product.id}`)}
          >
            <div className="product-thumb">
              {product.image ? (
                <img src={product.image} alt={product.name} className="product-image" />
              ) : (
                <div className="product-image-placeholder">📦</div>
              )}
              {product.badge && (
                <span className="product-badge">{product.badge}</span>
              )}
              <button 
                type="button"
                className={`like-btn ${product.isLiked ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  product.onLike?.(product.id);
                }}
                aria-label="Like product"
              >
                {product.isLiked ? "❤️" : "🤍"}
              </button>
            </div>
            
            <div className="product-body">
              <h3>{product.name}</h3>
              
              <div className="product-price-row">
                <strong className="product-price">{formatPrice(product.price)}đ</strong>
                {product.discountPrice && product.originalPrice > product.price && (
                  <span className="product-original-price">
                    {formatPrice(product.originalPrice)}đ
                  </span>
                )}
              </div>
              
              <div className="product-meta">
                <span className="product-category-tag-sub">{product.categoryName}</span>
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
