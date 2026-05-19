import { quickLinks } from "../utils";
import "./HeroCarousel.css";

function HeroCarousel({ currentSlide, setCurrentSlide, onVoucherClick, banners }) {
  const displayBanners = banners && banners.length > 0 ? banners : [];

  return (
    <section className="hero-banner">
      <div className="hero-carousel">
        <div 
          className="hero-carousel-track" 
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {displayBanners.map((src, index) => (
            <div className="hero-carousel-slide" key={index}>
              <img src={src} alt={`Banner ${index + 1}`} />
            </div>
          ))}
        </div>
        <button 
          type="button" 
          className="carousel-btn prev" 
          onClick={() => setCurrentSlide(prev => (prev === 0 ? displayBanners.length - 1 : prev - 1))}
        >
          &#10094;
        </button>
        <button 
          type="button" 
          className="carousel-btn next" 
          onClick={() => setCurrentSlide(prev => (prev + 1) % displayBanners.length)}
        >
          &#10095;
        </button>
        <div className="carousel-dots">
          {displayBanners.map((_, index) => (
            <span 
              key={index} 
              className={`dot ${currentSlide === index ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            ></span>
          ))}
        </div>
      </div>

      <div className="quick-entry-grid">
        {quickLinks.map((item) => (
          <article 
            key={item.label} 
            className="quick-entry-card"
            onClick={item.label === "Voucher" ? onVoucherClick : undefined}
            style={item.label === "Voucher" ? { cursor: 'pointer' } : {}}
          >
            <div className="quick-entry-icon">
              <img src={item.icon} alt={item.label} />
            </div>
            <span>{item.label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HeroCarousel;
