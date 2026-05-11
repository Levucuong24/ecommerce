import Logo from "../../../components/Logo";

function Header({ user, onOpenLogin, onOpenCart, onLogout }) {
  return (
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
                <button type="button" onClick={onLogout} className="logout-btn">
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
  );
}

export default Header;
