import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";
import { getAuthToken } from "../../utils/authStorage";
import { imageMap, mockVouchers } from "../home/utils";
import { DATA_EVENTS, emitDataChanged } from "../../utils/realtimeEvents";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const currencyFormatter = new Intl.NumberFormat("vi-VN");

const formatPrice = (price) => {
  return currencyFormatter.format(price);
};

function CartPage({ user, onLogout, onOpenLogin, onBackHome }) {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedVoucherIds, setSavedVoucherIds] = useState([]);
  const [selectedVoucherId, setSelectedVoucherId] = useState("");
  const [apiCoupons, setApiCoupons] = useState([]);
  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [addressDetail, setAddressDetail] = useState("");
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [useCoins, setUseCoins] = useState(false);

  useEffect(() => {
    const fetchUserCoins = async () => {
      if (!user) return;
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
        console.error("Lỗi khi tải số xu:", error);
      }
    };
    fetchUserCoins();
  }, [user]);

  const handleCheckout = async () => {
    if (!fullName.trim() || !phone.trim() || !addressDetail.trim()) {
      alert("Vui lòng điền đầy đủ thông tin giao hàng!");
      return;
    }
    
    setIsCheckoutLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addressSnapshot: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            detail: addressDetail.trim(),
          },
          paymentMethod: "COD",
          selectedVoucherId: selectedVoucherId || undefined,
          useCoins,
        }),
      });

      if (response.ok) {
        if (selectedVoucherId) {
          const saved = JSON.parse(localStorage.getItem("savedVouchers") || "[]");
          const updated = saved.filter(id => id !== selectedVoucherId);
          localStorage.setItem("savedVouchers", JSON.stringify(updated));
        }
        emitDataChanged(DATA_EVENTS.USERS);
        alert("Đặt hàng thành công!");
        navigate("/orders/history");
      } else {
        const data = await response.json();
        alert(data.message || "Đặt hàng thất bại, vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      alert("Đã xảy ra lỗi khi đặt hàng!");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedVouchers") || "[]");
    setSavedVoucherIds(saved);
  }, []);

  useEffect(() => {
    const syncMockVouchers = async () => {
      if (!user) return;
      try {
        const response = await fetch(`${apiUrl}/orders/my`, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const saved = JSON.parse(localStorage.getItem("savedVouchers") || "[]");
          let updated = [...saved];
          let changed = false;
          
          // 1. Remove mock vouchers that are used in active orders (pending, processing, completed)
          const activeUsedMockVouchers = data
            .filter(o => o.orderStatus !== "cancelled")
            .map(o => o.voucherId)
            .filter(vid => vid && vid.startsWith('v'));
            
          const beforeLen = updated.length;
          updated = updated.filter(vid => !activeUsedMockVouchers.includes(vid));
          if (updated.length !== beforeLen) {
            changed = true;
          }

          // 2. Restore mock vouchers that were used in cancelled orders (and are not used in any active orders)
          const cancelledMockVouchers = data
            .filter(o => o.orderStatus === "cancelled")
            .map(o => o.voucherId)
            .filter(vid => vid && vid.startsWith('v'));

          for (const vid of cancelledMockVouchers) {
            if (!activeUsedMockVouchers.includes(vid) && !updated.includes(vid)) {
              updated.push(vid);
              changed = true;
            }
          }

          if (changed) {
            localStorage.setItem("savedVouchers", JSON.stringify(updated));
            setSavedVoucherIds(updated);
          }
        }
      } catch (err) {
        console.error("Error syncing mock vouchers:", err);
      }
    };
    syncMockVouchers();
  }, [user]);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/cart`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.items)) {
          // Lọc bỏ các sản phẩm đã bị xóa khỏi hệ thống (productId === null) để tránh crash
          data.items = data.items.filter(item => item.productId !== null);
        }
        setCart(data);
      }
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const fetchCoupons = useCallback(async () => {
    if (!user) return;
    try {
      const storeIds = cart?.items
        ? [...new Set(cart.items.map(item => item.productId?.storeId).filter(id => !!id))]
        : [];
      
      const token = getAuthToken();
      const url = `${apiUrl}/coupons/applicable?storeIds=${storeIds.join(",")}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.items)) {
          setApiCoupons(data.items);
        }
      }
    } catch (error) {
      console.error("Lỗi khi tải coupon:", error);
    }
  }, [user, cart]);

  const handleFollowStore = async (storeId) => {
    try {
      const response = await fetch(`${apiUrl}/stores/${storeId}/follow`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        alert("Đã theo dõi cửa hàng thành công!");
        fetchCoupons(); // Refresh coupons to update follow status!
      } else {
        alert("Không thể theo dõi cửa hàng lúc này");
      }
    } catch (error) {
      console.error("Lỗi khi theo dõi cửa hàng:", error);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Helper lấy thông tin giá của sản phẩm hoặc biến thể màu sắc tương ứng
  const getItemPriceInfo = (item) => {
    if (item.color && item.productId?.colors) {
      const colorObj = item.productId.colors.find(c => c.name === item.color);
      if (colorObj) {
        return {
          price: colorObj.price,
          discountPrice: colorObj.discountPrice
        };
      }
    }
    return {
      price: item.productId?.price || 0,
      discountPrice: item.productId?.discountPrice
    };
  };

  const getItemStock = (item) => {
    if (item.color && item.productId?.colors) {
      const colorObj = item.productId.colors.find(c => c.name === item.color);
      if (colorObj) {
        return colorObj.stock;
      }
    }
    return item.productId?.stock || 0;
  };

  const updateQuantity = async (productId, newQuantity, color) => {
    if (newQuantity < 1) return;
    try {
      const response = await fetch(`${apiUrl}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ productId, quantity: newQuantity, replace: true, color }),
      });
      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng:", error);
    }
  };

  const removeItem = async (productId, color) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
      return;
    }
    try {
      const url = color 
        ? `${apiUrl}/cart/${productId}?color=${encodeURIComponent(color)}`
        : `${apiUrl}/cart/${productId}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
    }
  };

  const clearCart = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?")) {
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/cart`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error("Lỗi khi xóa toàn bộ giỏ hàng:", error);
    }
  };

  const calculateSubtotal = () => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => {
      const priceInfo = getItemPriceInfo(item);
      const price = priceInfo.discountPrice || priceInfo.price || 0;
      return sum + price * item.quantity;
    }, 0);
  };

  const selectedVoucher = 
    mockVouchers.find(v => v.id === selectedVoucherId) ||
    apiCoupons.find(v => v._id === selectedVoucherId);

  const calculateDiscount = (subtotal) => {
    if (!selectedVoucher) return 0;
    
    // Check if it's store-specific
    if (selectedVoucher.storeId) {
      const storeObj = selectedVoucher.storeId;
      const storeIdStr = (storeObj._id || storeObj).toString();
      const storeSubtotal = cart?.items
        ? cart.items
            .filter(item => {
              const itemStoreId = item.productId?.storeId;
              const itemStoreIdStr = (itemStoreId?._id || itemStoreId || "").toString();
              return itemStoreIdStr === storeIdStr;
            })
            .reduce((sum, item) => {
              const priceInfo = getItemPriceInfo(item);
              const price = priceInfo.discountPrice || priceInfo.price || 0;
              return sum + price * item.quantity;
            }, 0)
        : 0;

      const minOrder = selectedVoucher.minOrder || 0;
      if (storeSubtotal < minOrder) return 0;

      const type = selectedVoucher.discountType === 'percentage' ? 'percent' : 'fixed';
      const value = selectedVoucher.value || 0;

      if (type === 'percent') {
        const discountAmount = (storeSubtotal * value) / 100;
        return discountAmount > storeSubtotal ? storeSubtotal : discountAmount;
      } else if (type === 'fixed') {
        return value > storeSubtotal ? storeSubtotal : value;
      }
    } else {
      // Platform voucher
      const minOrder = selectedVoucher.minOrder || 0;
      if (subtotal < minOrder) return 0;

      const type = selectedVoucher.type || (selectedVoucher.discountType === 'percentage' ? 'percent' : 'fixed');
      const value = selectedVoucher.value || selectedVoucher.discountPercent || selectedVoucher.discountAmount || 0;

      if (type === 'percent') {
        const discountAmount = (subtotal * value) / 100;
        return discountAmount > subtotal ? subtotal : discountAmount;
      } else if (type === 'fixed') {
        return value > subtotal ? subtotal : value;
      }
    }
    return 0;
  };

  const subtotal = calculateSubtotal();
  const discount = calculateDiscount(subtotal);
  const total = subtotal - discount > 0 ? subtotal - discount : 0;
  const coinsDiscount = useCoins ? Math.min(userCoins, total) : 0;
  const finalTotal = total - coinsDiscount;

  const formatPriceLocal = (price) => {
    return formatPrice(price);
  };

  return (
    <main className="cart-page shopee-inspired">
      <header className="cart-header" style={{ background: "white", padding: "10px 5%", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <Logo className="cart-brand" onClick={onBackHome} style={{ cursor: "pointer" }} />
          <div style={{ fontSize: "20px", color: "var(--primary)", borderLeft: "1px solid var(--primary)", paddingLeft: "15px" }}>Giỏ Hàng</div>
        </div>
        <button type="button" className="cart-back-button" onClick={onBackHome} style={{ background: "none", color: "var(--text-secondary)", fontWeight: "500" }}>
          Quay lại trang chủ
        </button>
      </header>

      <section className="content-shell" style={{ paddingTop: "20px" }}>
        {!user ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <p>Vui lòng đăng nhập để xem giỏ hàng</p>
            <button className="primary-btn" onClick={onOpenLogin} style={{ marginTop: "20px" }}>Đăng Nhập</button>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>Đang tải...</div>
        ) : !cart || cart.items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0", background: "white", borderRadius: "8px" }}>
            <img src="/images/logochuacosanpham.png" alt="Empty" style={{ width: "100px", marginBottom: "20px" }} />
            <p>Giỏ hàng của bạn còn trống</p>
            <button className="primary-btn" onClick={onBackHome} style={{ marginTop: "20px" }}>Mua Sắm Ngay</button>
          </div>
        ) : (
          <div className="cart-container" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>
            <div className="cart-items-list" style={{ background: "white", borderRadius: "8px", overflow: "hidden" }}>
              <div className="cart-header-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", padding: "15px", borderBottom: "1px solid #eee", fontSize: "14px", color: "#888", alignItems: "center" }}>
                <span>Sản Phẩm</span>
                <span style={{ textAlign: "center" }}>Đơn Giá</span>
                <span style={{ textAlign: "center" }}>Số Lượng</span>
                <span style={{ textAlign: "center" }}>Số Tiền</span>
                <div style={{ textAlign: "center" }}>
                  <button 
                    onClick={clearCart}
                    style={{ background: "none", color: "var(--primary)", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>
              
              {cart.items.map((item) => {
                const priceInfo = getItemPriceInfo(item);
                // Tìm ảnh của riêng màu sắc đó nếu có
                let itemImg = item.productId.images?.[0];
                if (item.color && item.productId.colors) {
                  const colorObj = item.productId.colors.find(c => c.name === item.color);
                  if (colorObj && colorObj.images?.[0]) {
                    itemImg = colorObj.images[0];
                  }
                }
                const displayImg = imageMap[itemImg] || itemImg;

                return (
                  <div key={`${item.productId._id}-${item.color || 'none'}`} className="cart-item-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", padding: "20px 15px", alignItems: "center", borderBottom: "1px solid #eee" }}>
                    <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                      <img 
                        src={displayImg} 
                        alt={item.productId.name} 
                        style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "4px" }}
                      />
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "500" }}>{item.productId.name}</div>
                        {item.color && (
                          <div style={{ fontSize: "12px", color: "var(--shopee-red)", marginTop: "6px", background: "#fff5f5", padding: "2px 8px", borderRadius: "4px", display: "inline-block", fontWeight: "600", border: "1px solid rgba(238, 77, 45, 0.15)" }}>
                            Phân loại: {item.color}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: "center" }}>
                      {priceInfo.discountPrice ? (
                        <div>
                          <div style={{ color: "#888", textDecoration: "line-through", fontSize: "12px" }}>{formatPrice(priceInfo.price)}đ</div>
                          <div style={{ fontWeight: "500" }}>{formatPrice(priceInfo.discountPrice)}đ</div>
                        </div>
                      ) : (
                        <div style={{ fontWeight: "500" }}>{formatPrice(priceInfo.price)}đ</div>
                      )}
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div className="quantity-selector" style={{ scale: "0.8" }}>
                        <button className="qty-btn" onClick={() => updateQuantity(item.productId._id, item.quantity - 1, item.color)}>-</button>
                        <input 
                          type="text" 
                          defaultValue={item.quantity} 
                          key={item.quantity}
                          className="qty-input" 
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const stock = getItemStock(item);
                            if (isNaN(val) || val < 1) {
                              e.target.value = item.quantity;
                            } else if (val > stock) {
                              alert("Số lượng bạn chọn đã đạt mức tối đa của sản phẩm này");
                              e.target.value = stock;
                              updateQuantity(item.productId._id, stock, item.color);
                            } else if (val !== item.quantity) {
                              updateQuantity(item.productId._id, val, item.color);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.target.blur();
                            }
                          }}
                        />
                        <button 
                          className="qty-btn" 
                          onClick={() => {
                            const stock = getItemStock(item);
                            if (item.quantity >= stock) {
                              alert("Số lượng bạn chọn đã đạt mức tối đa của sản phẩm này");
                            } else {
                              updateQuantity(item.productId._id, item.quantity + 1, item.color);
                            }
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: "center", color: "var(--primary)", fontWeight: "600" }}>
                      {formatPrice((priceInfo.discountPrice || priceInfo.price) * item.quantity)}đ
                    </div>
                    
                    <div style={{ textAlign: "center" }}>
                      <button 
                        onClick={() => removeItem(item.productId._id, item.color)}
                        style={{ background: "none", color: "#555", cursor: "pointer", fontSize: "14px" }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart-summary-panel" style={{ background: "white", padding: "20px", borderRadius: "8px", height: "fit-content", position: "sticky", top: "174px" }}>
              <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>Tổng Thanh Toán</h3>
              
              {(savedVoucherIds.length > 0 || apiCoupons.length > 0) && (
                <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px dashed #eee" }}>
                  <span style={{ display: "block", marginBottom: "10px", fontWeight: "500", fontSize: "14px" }}>Voucher của bạn</span>
                  <button
                    type="button"
                    onClick={() => setShowVoucherModal(true)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      border: "1px solid var(--primary)",
                      color: "var(--primary)",
                      background: "var(--primary-light, #fff5f5)",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span>{selectedVoucher ? `Đã chọn: ${selectedVoucher.code || selectedVoucher.title}` : "Chọn hoặc nhập mã Voucher"}</span>
                    <span>&gt;</span>
                  </button>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", color: "#555" }}>
                <span>Tổng tiền hàng:</span>
                <span>{formatPrice(subtotal)}đ</span>
              </div>
              
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", color: "var(--primary)" }}>
                  <span>Giảm giá Voucher:</span>
                  <span>-{formatPrice(discount)}đ</span>
                </div>
              )}

              {coinsDiscount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", color: "#d97706" }}>
                  <span>Giảm giá bằng xu:</span>
                  <span>-{formatPrice(coinsDiscount)}đ</span>
                </div>
              )}

              {userCoins > 0 && (
                <div 
                  style={{ 
                    marginBottom: "20px", 
                    paddingBottom: "20px", 
                    borderBottom: "1px dashed #eee",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer"
                  }}
                  onClick={() => setUseCoins(!useCoins)}
                >
                  <input
                    type="checkbox"
                    checked={useCoins}
                    onChange={(e) => setUseCoins(e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: "pointer", width: "16px", height: "16px" }}
                  />
                  <div style={{ fontSize: "13px", color: "#333", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>Dùng</span>
                    <span style={{ color: "#d97706", fontWeight: "bold" }}>🪙 {formatPrice(userCoins)} xu</span>
                    <span>để giảm {formatPrice(Math.min(userCoins, total))}đ</span>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px dashed #eee" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#333" }}>Thông Tin Giao Hàng</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="Họ và tên người nhận"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "13px", width: "100%", boxSizing: "border-box" }}
                  />
                  <input
                    type="text"
                    placeholder="Số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "13px", width: "100%", boxSizing: "border-box" }}
                  />
                  <textarea
                    placeholder="Địa chỉ giao hàng chi tiết"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    rows="2"
                    style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "13px", width: "100%", boxSizing: "border-box", fontFamily: "inherit", resize: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontWeight: "bold", fontSize: "18px", color: "var(--primary)" }}>
                <span>Tổng cộng:</span>
                <span>{formatPrice(finalTotal)}đ</span>
              </div>
              <button 
                className="primary-btn" 
                style={{ width: "100%", padding: "12px", fontSize: "16px" }}
                onClick={handleCheckout}
                disabled={isCheckoutLoading}
              >
                {isCheckoutLoading ? "Đang xử lý..." : "Mua Hàng"}
              </button>
            </div>
          </div>
        )}
      </section>

      {showVoucherModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowVoucherModal(false)}
        >
          <div
            style={{
              background: "white",
              padding: "24px 30px",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#1e293b" }}>Chọn Shopee Voucher</h3>
              <button
                onClick={() => setShowVoucherModal(false)}
                style={{ background: "none", border: "none", fontSize: "20px", color: "#94a3b8", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", paddingRight: "5px" }}>
              {/* Platform Mock Vouchers */}
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#64748b" }}>Ưu đãi từ Shopee</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "25px" }}>
                {savedVoucherIds.map(vid => {
                  const v = mockVouchers.find(mv => mv.id === vid);
                  if (!v) return null;
                  const isEligible = subtotal >= v.minOrder;
                  const isSelected = selectedVoucherId === vid;

                  return (
                    <div
                      key={vid}
                      style={{
                        display: "flex",
                        border: isSelected ? "1px solid var(--primary)" : "1px solid #e2e8f0",
                        borderRadius: "8px",
                        overflow: "hidden",
                        opacity: isEligible ? 1 : 0.6,
                        background: isSelected ? "#fff5f5" : "white"
                      }}
                    >
                      {/* Left color bar */}
                      <div style={{ width: "80px", background: "var(--primary)", color: "white", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "10px", textAlign: "center" }}>
                        <span style={{ fontSize: "20px" }}>🎟️</span>
                        <span style={{ fontSize: "10px", fontWeight: "bold", marginTop: "4px" }}>Platform</span>
                      </div>
                      
                      {/* Content */}
                      <div style={{ flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: "14px", color: "#1e293b" }}>{v.title}</div>
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                            Đơn tối thiểu {formatPrice(v.minOrder)}đ
                          </div>
                        </div>
                        {!isEligible && (
                          <div style={{ fontSize: "11px", color: "var(--primary)", marginTop: "4px" }}>
                            Cần mua thêm {formatPrice(v.minOrder - subtotal)}đ
                          </div>
                        )}
                      </div>

                      {/* Action */}
                      <div style={{ display: "flex", alignItems: "center", paddingRight: "16px" }}>
                        <button
                          disabled={!isEligible}
                          onClick={() => {
                            setSelectedVoucherId(isSelected ? "" : vid);
                            setShowVoucherModal(false);
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "4px",
                            border: "none",
                            background: isSelected ? "#64748b" : (isEligible ? "var(--primary)" : "#cbd5e1"),
                            color: "white",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: isEligible ? "pointer" : "not-allowed"
                          }}
                        >
                          {isSelected ? "Bỏ chọn" : "Dùng ngay"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Shop Specific Coupons */}
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#64748b" }}>Voucher từ Người bán</h4>
              {apiCoupons.length === 0 ? (
                <div style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "10px" }}>Chưa có voucher của Shop nào khả dụng</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {apiCoupons.filter(v => v.isActive !== false && (!v.expiredAt || new Date(v.expiredAt) > new Date())).map(v => {
                    const isStoreCoupon = !!v.storeId;
                    const storeObj = v.storeId || {};
                    const storeName = storeObj.name || "Cửa hàng";
                    
                    // Check subtotal of the specific store
                    const storeSubtotal = cart?.items
                      ? cart.items
                          .filter(item => {
                            const itemStoreId = item.productId?.storeId;
                            const itemStoreIdStr = (itemStoreId?._id || itemStoreId || "").toString();
                            const storeIdStr = (storeObj._id || storeObj || "").toString();
                            return itemStoreIdStr === storeIdStr;
                          })
                          .reduce((sum, item) => {
                            const priceInfo = getItemPriceInfo(item);
                            const price = priceInfo.discountPrice || priceInfo.price || 0;
                            return sum + price * item.quantity;
                          }, 0)
                      : 0;

                    const isEligibleOrder = storeSubtotal >= (v.minOrder || 0);

                    // Check if followed
                    const userIdStr = user?._id || user?.id;
                    const isFollowing = storeObj.followers?.some(fid => {
                      const idStr = typeof fid === "object" ? (fid._id || fid) : fid;
                      return idStr.toString() === userIdStr?.toString();
                    });

                    const isSelected = selectedVoucherId === v._id;

                    return (
                      <div
                        key={v._id}
                        style={{
                          display: "flex",
                          border: isSelected ? "1px solid var(--primary)" : "1px solid #e2e8f0",
                          borderRadius: "8px",
                          overflow: "hidden",
                          background: isSelected ? "#fff5f5" : "white"
                        }}
                      >
                        {/* Left color bar */}
                        <div style={{ width: "80px", background: isStoreCoupon ? "#10b981" : "var(--primary)", color: "white", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "10px", textAlign: "center" }}>
                          <span style={{ fontSize: "20px" }}>🏪</span>
                          <span style={{ fontSize: "10px", fontWeight: "bold", marginTop: "4px" }}>Shop</span>
                        </div>
                        
                        {/* Content */}
                        <div style={{ flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontWeight: "bold", fontSize: "13px", color: "#64748b" }}>Shop: {storeName}</div>
                            <div style={{ fontWeight: "bold", fontSize: "14px", color: "#1e293b", marginTop: "2px" }}>{v.code}</div>
                            <div style={{ fontSize: "12px", color: "#1e293b", marginTop: "4px", fontWeight: "500" }}>
                              Giảm {v.value}{v.discountType === 'percentage' ? '%' : 'đ'}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                              Đơn tối thiểu {formatPrice(v.minOrder || 0)}đ (của Shop)
                            </div>
                          </div>
                          
                          {!isEligibleOrder && (
                            <div style={{ fontSize: "11px", color: "var(--primary)", marginTop: "4px" }}>
                              Cần mua thêm {formatPrice((v.minOrder || 0) - storeSubtotal)}đ từ Shop
                            </div>
                          )}

                          {!isFollowing && (
                            <div style={{ fontSize: "11px", color: "#d97706", marginTop: "4px", fontWeight: "600" }}>
                              ⚠️ Yêu cầu theo dõi Shop để mở khóa
                            </div>
                          )}
                        </div>

                        {/* Action */}
                        <div style={{ display: "flex", alignItems: "center", paddingRight: "16px" }}>
                          {!isFollowing ? (
                            <button
                              onClick={() => handleFollowStore(storeObj._id)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "4px",
                                border: "1px solid #d97706",
                                background: "#fffbeb",
                                color: "#d97706",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer"
                              }}
                            >
                              Theo dõi Shop
                            </button>
                          ) : (
                            <button
                              disabled={!isEligibleOrder}
                              onClick={() => {
                                setSelectedVoucherId(isSelected ? "" : v._id);
                                setShowVoucherModal(false);
                              }}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "4px",
                                border: "none",
                                background: isSelected ? "#64748b" : (isEligibleOrder ? "#10b981" : "#cbd5e1"),
                                color: "white",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: isEligibleOrder ? "pointer" : "not-allowed"
                              }}
                            >
                              {isSelected ? "Bỏ chọn" : "Dùng ngay"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "15px", marginTop: "15px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowVoucherModal(false)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  background: "white",
                  color: "#475569",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default CartPage;
