import { useNavigate } from "react-router-dom";
import { formatPrice } from "../utils";

function FlashSale({ products }) {
  const navigate = useNavigate();

  if (!products || products.length === 0) {
    return (
      <section className="flash-sale-panel">
        <div className="section-heading">
          <h2>Flash Sale</h2>
        </div>
        <div className="empty-state">
          <p>Chưa có sản phẩm flash sale.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flash-sale-panel">
      <div className="section-heading">
        <h2>Flash Sale</h2>
      </div>
      <div className="flash-sale-grid">
        {products.slice(0, 4).map((product) => (
          <article
            key={product.id}
            className="flash-item-card"
            style={{ cursor: "pointer" }}
            onClick={() => product.id && navigate(`/product/${product.id}`)}
          >
            <div className="flash-item-thumb">
              {product.image ? (
                <img src={product.image} alt={product.name} />
              ) : (
                <span>{product.badge}</span>
              )}
            </div>
            <h3>{product.name}</h3>
            <div className="product-category-tag">{product.categoryName}</div>
            <strong>{formatPrice(product.price)}đ</strong>
            <span>{product.sold}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FlashSale;
