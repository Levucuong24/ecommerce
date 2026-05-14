import { useState, useEffect } from "react";
import Logo from "../../../components/Logo";
import { getAuthToken } from "../../../utils/authStorage";
import { DATA_EVENTS, subscribeDataChanged } from "../../../utils/realtimeEvents";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Header({ user, onOpenLogin, onOpenCart, onLogout, onSearch }) {
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Lắng nghe sự kiện dữ liệu thay đổi để cập nhật thông báo ngay lập tức
      const unsubscribe = subscribeDataChanged((event) => {
        if (event.type === DATA_EVENTS.PRODUCTS) {
          // Khi có sản phẩm mới được đăng, tải lại thông báo
          fetchNotifications();
        }
      });

      // Thiết lập polling mỗi 10 giây để cập nhật thông báo từ server
      const interval = setInterval(fetchNotifications, 10000);
      return () => {
        unsubscribe();
        clearInterval(interval);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${apiUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
      }
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch(`${apiUrl}/notifications/mark-all-read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", error);
    }
  };

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
            <span className="notification-trigger">
              Thong bao
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </span>
            <div className="notification-popup">
              {user ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Thông báo mới nhận</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        style={{ background: "none", color: "var(--primary)", fontSize: "0.85rem", fontWeight: "500" }}
                      >
                        Đánh dấu tất cả đã đọc
                      </button>
                    )}
                  </div>
                  {notifications.length > 0 ? (
                    <div className="notification-list">
                      {notifications.map((notif) => (
                        <div 
                          key={notif._id} 
                          className={`notification-item ${notif.isRead ? "" : "unread"}`}
                          onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                        >
                          <h4>{notif.title}</h4>
                          <p>{notif.message}</p>
                          <span className="time">{new Date(notif.createdAt).toLocaleString("vi-VN")}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                      <img src="/images/logothongbao.png" alt="Thong bao" className="notification-empty-img" />
                      <p>Chưa có thông báo mới</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <img src="/images/logothongbao.png" alt="Thong bao" className="notification-empty-img" />
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
                <button type="button" onClick={() => window.location.href = "/following-shops"} className="admin-dash-btn">
                  Shop đang theo dõi
                </button>
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
