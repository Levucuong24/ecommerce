import { useState } from "react";
import Logo from "../../../components/Logo";

function Header({ user, onOpenLogin, onOpenCart, onLogout, onSearch }) {
  const [query, setQuery] = useState("");

  const handleSearch = (event) => {
    event?.preventDefault();
    onSearch?.(query);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const openDashboard = () => {
    if (user?.role === "admin") {
      window.location.href = "/admin";
      return;
    }

    if (user?.role === "staff") {
      window.location.href = "/staff";
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
              <img src="/images/logothongbao.png" alt="Thong bao" className="notification-empty-img" />
              {user ? (
                <p>Chua co thong bao moi</p>
              ) : (
                <>
                  <p>Dang nhap de xem Thong bao</p>
                  <div className="notification-actions">
                    <button type="button" onClick={onOpenLogin} className="notification-login-btn">
                      Dang nhap
                    </button>
                    <button type="button" className="notification-register-btn">
                      Dang ky
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <span>Ho tro</span>
          {user ? (
            <div className="user-dropdown-wrapper">
              <span className="shop-login-link" style={{ cursor: "pointer" }}>
                Hi, {user.name}
              </span>
              <div className="user-dropdown-popup">
                {(user.role === "admin" || user.role === "staff") && (
                  <button type="button" onClick={openDashboard} className="admin-dash-btn">
                    {user.role === "admin" ? "Quan tri he thong" : "Trang Staff"}
                  </button>
                )}
                <button type="button" onClick={onLogout} className="logout-btn">
                  Dang xuat
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
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button type="button" onClick={handleSearch}>
              Tim kiem
            </button>
          </div>

          <div className="shop-keywords">
            <span onClick={() => { setQuery("Tai nghe"); onSearch?.("Tai nghe"); }}>Tai nghe</span>
            <span onClick={() => { setQuery("Dien gia dung"); onSearch?.("Dien gia dung"); }}>Dien gia dung</span>
            <span onClick={() => { setQuery("May tinh bang"); onSearch?.("May tinh bang"); }}>May tinh bang</span>
            <span onClick={() => { setQuery("Deal 0h"); onSearch?.("Deal 0h"); }}>Deal 0h</span>
            <span onClick={() => { setQuery("Thoi trang nu"); onSearch?.("Thoi trang nu"); }}>Thoi trang nu</span>
          </div>
        </div>

        <div className="shop-cart-wrapper">
          <button type="button" className="shop-cart-pill" onClick={onOpenCart} aria-label="Gio hang">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </button>
          <div className="cart-popup">
            <div className="empty-cart-message">
              <img src="/images/logochuacosanpham.png" alt="Chua co san pham" className="empty-cart-img" />
              <p>Chua co san pham</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
