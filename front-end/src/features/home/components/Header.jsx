import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../../components/Logo";
import { getAuthToken } from "../../../utils/authStorage";
import { DATA_EVENTS, subscribeDataChanged } from "../../../utils/realtimeEvents";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Header({ user, onOpenLogin, onOpenCart, onLogout, onSearch }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cart, setCart] = useState(null);
  const [userCoins, setUserCoins] = useState(0);

  const fetchCoinsCount = async () => {
    try {
      const response = await fetch(`${apiUrl}/users/coins-status`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserCoins(data.coins || 0);
      }
    } catch (error) {
      console.error("Lỗi khi tải số lượng xu:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchLikedCount();
      fetchCartCount();
      fetchCoinsCount();
    }
  }, [user]);

  useEffect(() => {
    const unsubscribeLiked = subscribeDataChanged(DATA_EVENTS.LIKED_PRODUCTS_CHANGED, () => {
      if (user) fetchLikedCount();
    });

    const unsubscribeCart = subscribeDataChanged(DATA_EVENTS.CART_CHANGED, () => {
      if (user) {
        fetchCartCount();
        fetchCoinsCount();
      }
    });

    const unsubscribeUser = subscribeDataChanged(DATA_EVENTS.USER_COINS_CHANGED, () => {
      if (user) fetchCoinsCount();
    });

    return () => {
      unsubscribeLiked();
      unsubscribeCart();
      unsubscribeUser();
    };
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
        setNotifications(data.items || []);
        setUnreadCount(data.items?.filter((n) => !n.isRead).length || 0);
      }
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
    }
  };

  const fetchLikedCount = async () => {
    try {
      const response = await fetch(`${apiUrl}/products/liked-count`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLikedCount(data.count || 0);
      }
    } catch (error) {
      console.error("Lỗi khi tải số lượng yêu thích:", error);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await fetch(`${apiUrl}/cart`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCart(data);
        const count = data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        setCartCount(count);
      }
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch(`${apiUrl}/notifications/mark-all-read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Lỗi khi đánh dấu đọc tất cả:", error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Lỗi khi đánh dấu đọc thông báo:", error);
    }
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleSellerChannelClick = () => {
    if (!user) {
      onOpenLogin();
      return;
    }
    if (user.role === "seller" || user.role === "admin") {
      navigate("/seller");
    } else {
      navigate("/seller/register");
    }
  };

  const openDashboard = () => {
    if (user?.role === "admin") {
      navigate("/admin");
    } else if (user?.role === "staff") {
      navigate("/staff");
    }
  };

  return (
    <header className="shop-header">
      <div className="shop-header-top">
        <div className="shop-top-links">
          <span className="top-link" onClick={handleSellerChannelClick}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="top-link-icon">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Kênh Người Bán
          </span>
          <span className="top-divider">|</span>
          <span className="top-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="top-link-icon">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            Tải Ứng Dụng
          </span>
          <span className="top-divider">|</span>
          <span className="top-link">
            Kết nối
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="top-social-icon" aria-label="Facebook">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="top-social-icon" aria-label="Instagram">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          </span>
        </div>

        <div className="shop-top-links">
          <div className="notification-wrapper">
            <span className="notification-trigger top-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="top-link-icon">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              Thông Báo
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </span>
            <div className="notification-popup glass">
              {user ? (
                <>
                  <div className="popup-header">
                    <h3>Thông báo mới nhận</h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="popup-action-btn">
                        Đánh dấu đã đọc tất cả
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
                          <div className="notif-dot"></div>
                          <div className="notif-content">
                            <h4>{notif.title}</h4>
                            <p>{notif.message}</p>
                            <span className="time">{new Date(notif.createdAt).toLocaleString("vi-VN")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="popup-empty-state">
                      <img src="/images/logothongbao.png" alt="Không có thông báo" className="notification-empty-img" />
                      <p>Chưa có thông báo mới</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="popup-empty-state">
                  <img src="/images/logothongbao.png" alt="Đăng nhập" className="notification-empty-img" />
                  <p>Đăng nhập để xem thông báo</p>
                  <div className="notification-actions">
                    <button type="button" onClick={onOpenLogin} className="notification-login-btn">
                      Đăng nhập
                    </button>
                    <button type="button" className="notification-register-btn">
                      Đăng ký
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <span className="top-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="top-link-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Hỗ Trợ
          </span>
          
          {user ? (
            <div className="user-profile-nav">
              <div className="user-coins-pill" title="Số xu tích lũy của bạn">
                <span className="coin-icon">🪙</span>
                <span>{new Intl.NumberFormat("vi-VN").format(userCoins)} Xu</span>
              </div>
              <div className="user-dropdown-wrapper">
                <span className="shop-login-link user-greeting">
                  <div className="avatar-small">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  Hi, {user.name}
                </span>
                <div className="user-dropdown-popup glass">
                  <button type="button" onClick={() => navigate("/profile")} className="dropdown-item">
                    Hồ sơ của tôi
                  </button>
                  <button type="button" onClick={() => navigate("/orders/history")} className="dropdown-item">
                    Đơn mua của tôi
                  </button>
                  <button type="button" onClick={() => navigate("/liked-products")} className="dropdown-item">
                    Sản phẩm yêu thích {likedCount > 0 && <span className="item-count">({likedCount})</span>}
                  </button>
                  <button type="button" onClick={() => navigate("/following-shops")} className="dropdown-item">
                    Shop đang theo dõi
                  </button>
                  {(user.role === "admin" || user.role === "staff") && (
                    <button type="button" onClick={openDashboard} className="dropdown-item admin-item">
                      {user.role === "admin" ? "Quản Trị Hệ Thống" : "Trang Nhân Viên"}
                    </button>
                  )}
                  <div className="dropdown-divider"></div>
                  <button type="button" onClick={onLogout} className="dropdown-item logout-item">
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button type="button" className="shop-login-link font-bold" onClick={onOpenLogin}>
              Đăng Nhập
            </button>
          )}
        </div>
      </div>

      <div className="shop-header-main">
        <Logo className="shop-brand" onClick={() => navigate('/home')} />

        <div className="shop-search-area">
          <div className="shop-search-box">
            <div className="search-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Tìm sản phẩm, thương hiệu và ưu đãi..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button type="button" onClick={handleSearch}>
              Tìm kiếm
            </button>
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
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          <div className="cart-popup glass">
            {user && cart && cart.items?.length > 0 ? (
              <div className="cart-popup-content">
                <div className="cart-popup-title">Sản Phẩm Mới Thêm</div>
                <div className="cart-popup-list">
                  {cart.items.slice(0, 5).map((item) => {
                    const price = (() => {
                      if (item.color && item.productId?.colors) {
                        const colorObj = item.productId.colors.find(c => c.name === item.color);
                        if (colorObj) return colorObj.discountPrice || colorObj.price;
                      }
                      return item.productId?.discountPrice || item.productId?.price || 0;
                    })();
                    
                    let itemImg = item.productId?.images?.[0];
                    if (item.color && item.productId?.colors) {
                      const colorObj = item.productId.colors.find(c => c.name === item.color);
                      if (colorObj && colorObj.images?.[0]) {
                        itemImg = colorObj.images[0];
                      }
                    }
                    
                    return (
                      <div key={`${item.productId?._id}-${item.color || 'none'}`} className="cart-popup-item">
                        <div className="cart-popup-item-thumb">
                          <img src={itemImg || "/images/cart.png"} alt={item.productId?.name} />
                        </div>
                        <div className="cart-popup-item-info">
                          <div className="name">{item.productId?.name}</div>
                          <div className="meta-row">
                            {item.color && (
                              <span className="color-tag">Màu: {item.color}</span>
                            )}
                            <span className="quantity">x{item.quantity}</span>
                          </div>
                          <div className="price">
                            {new Intl.NumberFormat("vi-VN").format(price)}đ
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {cart.items.length > 5 && (
                  <div className="cart-popup-more">Và {cart.items.length - 5} sản phẩm khác</div>
                )}
                <div className="cart-popup-footer">
                  <button type="button" className="cart-popup-view-btn" onClick={onOpenCart}>
                    Xem Giỏ Hàng
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-cart-message">
                <img src="/images/logochuacosanpham.png" alt="Chưa có sản phẩm" className="empty-cart-img" />
                <p>Chưa có sản phẩm trong giỏ hàng</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
