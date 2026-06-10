import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { quickLinks, bannerImages } from "../utils";
import "./HeroCarousel.css";

function HeroCarousel({ banners, onVoucherClick }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const autoPlayRef = useRef();

  const bannerList = banners && banners.length > 0 ? banners : bannerImages;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === bannerList.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? bannerList.length - 1 : prev - 1));
  };

  useEffect(() => {
    autoPlayRef.current = nextSlide;
  });

  useEffect(() => {
    const play = () => {
      autoPlayRef.current();
    };
    const interval = setInterval(play, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickLinkClick = (item) => {
    if (item.label === "Voucher") {
      if (onVoucherClick) onVoucherClick();
    } else if (item.label === "Flash Sale") {
      const el = document.querySelector(".flash-sale-panel");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (item.label === "Mall") {
      navigate("/mall");
    } else {
      navigate(`/search?keyword=${encodeURIComponent(item.label)}`);
    }
  };

  return (
    <section className="hero-banner animate-fade">
      <div className="hero-banner-main">
        {/* Left Side: Dynamic Slider */}
        <div className="hero-carousel">
          <div 
            className="hero-carousel-track"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {bannerList.map((banner, index) => {
              const imgSrc = typeof banner === "string" ? banner : banner.image;
              const linkUrl = typeof banner === "string" ? null : banner.link;
              return (
                <div 
                  key={index} 
                  className="hero-carousel-slide"
                  onClick={() => linkUrl && navigate(linkUrl)}
                  style={{ cursor: linkUrl ? "pointer" : "default" }}
                >
                  <img src={imgSrc} alt={`Ưu đãi ${index + 1}`} />
                </div>
              );
            })}
          </div>

          <button 
            type="button" 
            className="carousel-control prev-control" 
            onClick={prevSlide}
            aria-label="Slide trước"
          >
            &#10094;
          </button>
          <button 
            type="button" 
            className="carousel-control next-control" 
            onClick={nextSlide}
            aria-label="Slide tiếp theo"
          >
            &#10095;
          </button>

          <div className="carousel-dots-indicator">
            {bannerList.map((_, index) => (
              <span 
                key={index} 
                className={`indicator-dot ${currentSlide === index ? "active" : ""}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Elegant Bento Sidecards */}
        <div className="hero-side-cards">
          <div className="hero-mini-card promo-card-indigo">
            <div className="mini-card-badge">HOT</div>
            <span className="card-label">Săn Voucher Tuần</span>
            <h3>Giảm Đến 15%</h3>
            <p>Áp dụng cho mọi đơn hàng điện tử & công nghệ mới.</p>
            <button 
              type="button" 
              className="mini-card-cta"
              onClick={onVoucherClick}
            >
              Nhận Ngay
            </button>
          </div>
          <div className="hero-mini-card promo-card-rose">
            <div className="mini-card-badge-alt">LIVE</div>
            <span className="card-label">Flash Sale Đang Chạy</span>
            <h3>Mở Bán Đồng Giá</h3>
            <p>Hàng ngàn sản phẩm công nghệ từ 9k.</p>
            <button 
              type="button" 
              className="mini-card-cta"
              onClick={() => {
                const el = document.querySelector(".flash-sale-panel");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Săn Ngay
            </button>
          </div>
        </div>
      </div>

      {/* Quick Entry Grid */}
      <div className="quick-entry-grid">
        {quickLinks.map((item, index) => (
          <div 
            key={index} 
            className="quick-entry-card"
            onClick={() => handleQuickLinkClick(item)}
            style={{ cursor: "pointer" }}
          >
            <div className="quick-entry-icon">
              <img src={item.icon} alt={item.label} />
            </div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HeroCarousel;
