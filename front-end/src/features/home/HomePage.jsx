import Logo from "../../components/Logo";

const quickLinks = [
  { label: "Voucher", icon: "VC" },
  { label: "Free Ship", icon: "FS" },
  { label: "Mall", icon: "ML" },
  { label: "Flash Sale", icon: "SL" },
  { label: "Nap The", icon: "NT" },
  { label: "Do Dien Tu", icon: "DT" },
  { label: "Lam Dep", icon: "LD" },
  { label: "Gia Dung", icon: "GD" },
];

const categories = [
  "Thoi Trang",
  "Dien Thoai",
  "Laptop",
  "Gia Dung",
  "My Pham",
  "Me Va Be",
  "The Thao",
  "Nha Cua",
];

const products = [
  { name: "Tai nghe Bluetooth Pro", price: "449.000", sold: "Da ban 2,1k", badge: "-18%" },
  { name: "May loc khong khi mini", price: "1.290.000", sold: "Da ban 860", badge: "-25%" },
  { name: "Balo laptop chong nuoc", price: "329.000", sold: "Da ban 1,4k", badge: "-12%" },
  { name: "Ban phim co gaming", price: "799.000", sold: "Da ban 980", badge: "-15%" },
  { name: "Den hoc LED cam ung", price: "259.000", sold: "Da ban 730", badge: "-10%" },
  { name: "Dong ho thong minh S8", price: "1.590.000", sold: "Da ban 1,1k", badge: "-22%" },
];

function HomePage({ onOpenLogin }) {
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
            <span>Thong bao</span>
            <span>Ho tro</span>
            <button type="button" className="shop-login-link" onClick={onOpenLogin}>
              Login
            </button>
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

          <div className="shop-cart-pill">Gio hang</div>
        </div>
      </header>

      <section className="hero-banner">
        <div className="hero-banner-main">
          <div className="hero-copy">
            <p className="hero-label">Sieu sale xanh bien</p>
            <h1>Mua sam thong minh, deal dep moi ngay</h1>
            <p>
              Khong gian mua sam theo phong cach san thuong mai dien tu hien dai,
              toi uu cho flash sale, voucher va san pham noi bat.
            </p>
            <div className="hero-cta-row">
              <button type="button" className="hero-primary-button">
                Kham pha ngay
              </button>
              <button type="button" className="hero-secondary-button" onClick={onOpenLogin}>
                Dang nhap
              </button>
            </div>
          </div>

          <div className="hero-side-cards">
            <article className="hero-mini-card">
              <span>Ma giam gia</span>
              <strong>Giam toi 500K</strong>
            </article>
            <article className="hero-mini-card">
              <span>Van chuyen</span>
              <strong>Free ship toan quoc</strong>
            </article>
          </div>
        </div>

        <div className="quick-entry-grid">
          {quickLinks.map((item) => (
            <article key={item.label} className="quick-entry-card">
              <div className="quick-entry-icon">{item.icon}</div>
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
                <strong>{product.price}d</strong>
                <span>{product.sold}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="product-panel">
          <div className="section-heading">
            <h2>Goi y hom nay</h2>
            <span>San pham ban chay</span>
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <article key={product.name} className="product-card">
                <div className="product-thumb">
                  <span className="product-badge">{product.badge}</span>
                </div>
                <div className="product-body">
                  <h3>{product.name}</h3>
                  <strong>{product.price}d</strong>
                  <div className="product-meta">
                    <span>{product.sold}</span>
                    <span>Yeu thich</span>
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
