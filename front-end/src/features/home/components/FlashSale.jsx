import { useNavigate } from "react-router-dom";
import { formatPrice } from "../utils";

function FlashSale({ products }) {
  const navigate = useNavigate();

  return (
    <section className="flash-sale-panel">
      <div className="section-heading">
        <h2>Flash Sale</h2>
        <span>Ket thuc trong 02:15:22</span>
      </div>
      <div className="flash-sale-grid">
        {products.slice(0, 4).map((product) => (
          <article 
            key={product.id || product.name} 
            className="flash-item-card"
            style={{ cursor: 'pointer' }}
            onClick={() => product.id && navigate(`/product/${product.id}`)}
          >
            <div className="flash-item-thumb">{product.badge}</div>
            <h3>{product.name}</h3>
            <strong>{formatPrice(product.price)}d</strong>
            <span>{product.sold}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FlashSale;
