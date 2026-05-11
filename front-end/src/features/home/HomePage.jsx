import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";
import iphone15Pro from "../../assets/images/iphone15pro.png";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const quickLinks = [
  { label: "Voucher", icon: "/images/voucher.png" },
  { label: "Free Ship", icon: "/images/freeship.png" },
  { label: "Mall", icon: "/images/mall.png" },
  { label: "Flash Sale", icon: "/images/flashsale.png" },
  { label: "Nap The", icon: "/images/napthe.png" },
  { label: "Do Dien Tu", icon: "/images/dodientu.png" },
  { label: "Lam Dep", icon: "/images/lamdep.png" },
  { label: "Gia Dung", icon: "/images/giadung.png" },
];

const bannerImages = [
  "/images/flashsale.png",
  "/images/mall.png",
  "/images/voucher.png",
];

const fallbackCategories = [
  "Thoi Trang",
  "Dien Thoai",
  "Laptop",
  "Gia Dung",
  "My Pham",
  "Me Va Be",
  "The Thao",
  "Nha Cua",
];

const fallbackProducts = [
  { name: "Tai nghe Bluetooth Pro", price: 449000, sold: "Da ban 2,1k", badge: "-18%" },
  { name: "May loc khong khi mini", price: 1290000, sold: "Da ban 860", badge: "-25%" },
  { name: "Balo laptop chong nuoc", price: 329000, sold: "Da ban 1,4k", badge: "-12%" },
  { name: "Ban phim co gaming", price: 799000, sold: "Da ban 980", badge: "-15%" },
  { name: "Den hoc LED cam ung", price: 259000, sold: "Da ban 730", badge: "-10%" },
  { name: "Dong ho thong minh S8", price: 1590000, sold: "Da ban 1,1k", badge: "-22%" },
];

const formatPrice = (value) => Number(value || 0).toLocaleString("vi-VN");

const imageMap = {
  "iphone15.jpg": iphone15Pro,
  "iphone15pro.png": iphone15Pro,
};

const buildBadge = (price, discountPrice) => {
  if (!discountPrice || discountPrice >= price || !price) {
    return "Moi";
  }

  const percent = Math.round(((price - discountPrice) / price) * 100);
  return `-${percent}%`;
};

function HomePage({ onOpenLogin, onOpenCart }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(fallbackCategories);
  const [products, setProducts] = useState(fallbackProducts);
  const [user, setUser] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/home");
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Invalid user data in local storage");
      }
    }

    const fetchCategories = async () => {
      try {
        const response = await fetch(`${apiUrl}/categories?limit=8`);
        const data = await response.json();

        if (!response.ok || !Array.isArray(data.items) || data.items.length === 0) {
          return;
        }

        setCategories(data.items.map((item) => item.name));
      } catch (error) {
        // Keep fallback categories when backend is unavailable.
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${apiUrl}/products?limit=6`);
        const data = await response.json();

        if (!response.ok || !Array.isArray(data.items) || data.items.length === 0) {
          return;
        }

        setProducts(
          data.items.map((item) => ({
            name: item.name,
            price: item.discountPrice || item.price || 0,
            sold: `Ton kho ${item.stock ?? 0}`,
            badge: buildBadge(item.price, item.discountPrice),
            image: imageMap[item.images?.[0]] || iphone15Pro,
          }))
        );
      } catch (error) {
        // Keep fallback products when backend is unavailable.
      }
    };

    fetchCategories();
    fetchProducts();
  }, []);

  return (
    <main className="home-page shopee-inspired">
      <header className="shop-header">
        <div className="shop-header-top">
          <div className="shop-top-links">
            <span>Kenh nguoi ban</span>
            <span>Tai ung dung</span>
            <span>Ket noi</span>
          </div>
          <div className="shop-top-links">
            <div className="notification-wrapper">
              <span className="notification-trigger">Thong bao</span>
              <div className="notification-popup">
                <img src="/images/logothongbao.png" alt="Thông báo" className="notification-empty-img" />
                {user ? (
                  <p>Chưa có thông báo mới</p>
                ) : (
                  <>
                    <p>Đăng nhập để xem Thông báo</p>
                    <div className="notification-actions">
                      <button type="button" onClick={onOpenLogin} className="notification-login-btn">
                        Đăng nhập
                      </button>
                      <button type="button" className="notification-register-btn">
                        Đăng ký
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <span>Ho tro</span>
            {user ? (
              <div className="user-dropdown-wrapper">
                <span className="shop-login-link" style={{ cursor: 'pointer' }}>Hi, {user.name}</span>
                <div className="user-dropdown-popup">
                  <button type="button" onClick={handleLogout} className="logout-btn">
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="shop-login-link" onClick={onOpenLogin}>
                Login
              </button>
            )}
          </div>
        </div>

        <div className="shop-header-main">
          <Logo className="shop-brand" />

          <div className="shop-search-area">
            <div className="shop-search-box">
              <input type="text" placeholder="Tim san pham, shop va uu dai hom nay" />
              <button type="button">Tim kiem</button>
            </div>

            <div className="shop-keywords">
              <span>Tai nghe</span>
              <span>Dien gia dung</span>
              <span>May tinh bang</span>
              <span>Deal 0h</span>
              <span>Thoi trang nu</span>
            </div>
          </div>

          <div className="shop-cart-wrapper">
            <button type="button" className="shop-cart-pill" onClick={onOpenCart} aria-label="Giỏ hàng">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </button>
            <div className="cart-popup">
              <div className="empty-cart-message">
                <img src="/images/logochuacosanpham.png" alt="Chưa có sản phẩm" className="empty-cart-img" />
                <p>Chưa có sản phẩm</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="hero-banner">
        <div className="hero-carousel">
          <div 
            className="hero-carousel-track" 
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {bannerImages.map((src, index) => (
              <div className="hero-carousel-slide" key={index}>
                <img src={src} alt={`Banner ${index + 1}`} />
              </div>
            ))}
          </div>
          <button 
            type="button" 
            className="carousel-btn prev" 
            onClick={() => setCurrentSlide(prev => (prev === 0 ? bannerImages.length - 1 : prev - 1))}
          >
            &#10094;
          </button>
          <button 
            type="button" 
            className="carousel-btn next" 
            onClick={() => setCurrentSlide(prev => (prev + 1) % bannerImages.length)}
          >
            &#10095;
          </button>
          <div className="carousel-dots">
            {bannerImages.map((_, index) => (
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
            <article key={item.label} className="quick-entry-card">
              <div className="quick-entry-icon">
                <img src={item.icon} alt={item.label} />
              </div>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="content-shell">
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

        <section className="flash-sale-panel">
          <div className="section-heading">
            <h2>Flash Sale</h2>
            <span>Ket thuc trong 02:15:22</span>
          </div>
          <div className="flash-sale-grid">
            {products.slice(0, 4).map((product) => (
              <article key={product.name} className="flash-item-card">
                <div className="flash-item-thumb">{product.badge}</div>
                <h3>{product.name}</h3>
                <strong>{formatPrice(product.price)}d</strong>
                <span>{product.sold}</span>
              </article>
            ))}
          </div>
        </section>

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
      </section>
    </main>
  );
}

export default HomePage;
