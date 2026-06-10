import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../utils";

function FlashSale({ products }) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Countdown timer calculation to the end of the current day
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
      );
      const difference = endOfDay - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDigit = (num) => String(num).padStart(2, "0");

  if (!products || products.length === 0) {
    return (
      <section className="flash-sale-panel">
        <div className="section-heading">
          <div className="flash-heading-left">
            <h2>Flash Sale</h2>
          </div>
        </div>
        <div className="empty-state">
          <p>Chưa có sản phẩm khuyến mãi hôm nay.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flash-sale-panel animate-fade">
      <div className="section-heading">
        <div className="flash-heading-left">
          <h2>FLASH SALE</h2>
          <div className="countdown-timer">
            <span className="timer-block">{formatDigit(timeLeft.hours)}</span>
            <span className="timer-separator">:</span>
            <span className="timer-block">{formatDigit(timeLeft.minutes)}</span>
            <span className="timer-separator">:</span>
            <span className="timer-block">{formatDigit(timeLeft.seconds)}</span>
          </div>
        </div>
        <span className="flash-view-all" onClick={() => navigate("/search?flashSale=true")} style={{ cursor: 'pointer' }}>
          Xem Tất Cả &rsaquo;
        </span>
      </div>

      <div className="flash-sale-grid">
        {products.slice(0, 4).map((product) => {
          // Parse quantity sold count for meter percentage
          const soldCount = parseInt(String(product.sold).replace(/\D/g, "")) || 0;
          const totalStock = soldCount + 15; // Mock total stock limit
          const percentSold = Math.round((soldCount / totalStock) * 100) || 20;

          return (
            <article
              key={product.id}
              className="flash-item-card"
              onClick={() => product.id && navigate(`/product/${product.id}`)}
            >
              <div className="flash-item-thumb">
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <div className="image-placeholder-icon">📦</div>
                )}
                {product.badge && (
                  <span className="flash-discount-badge">{product.badge}</span>
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

              <div className="flash-item-body">
                <h3>{product.name}</h3>
                
                <div className="flash-price-row">
                  <strong className="flash-price">{formatPrice(product.price)}đ</strong>
                </div>

                {/* Custom Progress Bar for stock */}
                <div className="flash-progress-wrapper" title={`Đã bán ${soldCount}`}>
                  <div 
                    className="flash-progress-bar" 
                    style={{ width: `${Math.min(100, percentSold)}%` }}
                  />
                  <span className="flash-progress-label">
                    {soldCount > 10 ? `🔥 ĐÃ BÁN ${soldCount}` : `ĐÃ BÁN ${soldCount}`}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default FlashSale;
