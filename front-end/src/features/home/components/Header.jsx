import { useState } from "react";
import Logo from "../../../components/Logo";

function Header({ user, onOpenLogin, onOpenCart, onLogout, onSearch }) {
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e?.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

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
                {user.role === "admin" && (
                  <button type="button" onClick={() => window.location.href = "/admin"} className="admin-dash-btn">
                    Quản trị hệ thống
                  </button>
                )}
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
            <input
              type="text"
              placeholder="Tim san pham, shop va uu dai hom nay"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button type="button" onClick={handleSearch}>Tim kiem</button>
          </div>

          <div className="shop-keywords">
            <span onClick={() => { setQuery("Tai nghe"); onSearch?.("Tai nghe"); }}>Tai nghe</span>
            <span onClick={() => { setQuery("Điện gia dụng"); onSearch?.("Điện gia dụng"); }}>Điện gia dụng</span>
            <span onClick={() => { setQuery("Máy tính bảng"); onSearch?.("Máy tính bảng"); }}>Máy tính bảng</span>
            <span onClick={() => { setQuery("Deal 0h"); onSearch?.("Deal 0h"); }}>Deal 0h</span>
            <span onClick={() => { setQuery("Thời trang nữ"); onSearch?.("Thời trang nữ"); }}>Thời trang nữ</span>
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
