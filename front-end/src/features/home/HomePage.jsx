import Logo from "../../components/Logo";

function HomePage({ onOpenLogin }) {
  return (
    <main className="home-page">
      <header className="home-header">
        <Logo className="home-logo" />
        <button type="button" className="home-login-button" onClick={onOpenLogin}>
          Login
        </button>
      </header>

      <section className="home-hero">
        <div className="home-copy">
          <p className="home-tag">Welcome to our store</p>
          <h1>Mua sam thong minh cho cuoc song hien dai</h1>
          <p className="home-text">
            Kham pha san pham noi bat, uu dai moi nhat va trai nghiem mua sam
            nhanh gon tren nen tang ecommerce cua ban.
          </p>
          <div className="home-actions">
            <button type="button" className="primary-button home-cta" onClick={onOpenLogin}>
              Bat dau ngay
            </button>
          </div>
        </div>

        <div className="home-highlight">
          <div className="highlight-card highlight-primary">
            <span>Flash sale</span>
            <strong>Giam den 50%</strong>
          </div>
          <div className="highlight-grid">
            <div className="highlight-card">
              <span>Giao hang</span>
              <strong>Toan quoc</strong>
            </div>
            <div className="highlight-card">
              <span>Thanh vien moi</span>
              <strong>Voucher 100K</strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
