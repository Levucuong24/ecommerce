import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";
import { getAuthToken } from "../../utils/authStorage";
import { imageMap, mockVouchers } from "../home/utils";

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

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedVouchers") || "[]");
    setSavedVoucherIds(saved);
  }, []);

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

  const selectedVoucher = mockVouchers.find(v => v.id === selectedVoucherId);

  const calculateDiscount = (subtotal) => {
    if (!selectedVoucher) return 0;
    if (subtotal < selectedVoucher.minOrder) return 0;

    if (selectedVoucher.type === 'percent') {
      return (subtotal * selectedVoucher.discountPercent) / 100;
    } else if (selectedVoucher.type === 'fixed') {
      return selectedVoucher.discountAmount;
    }
    return 0;
  };

  const subtotal = calculateSubtotal();
  const discount = calculateDiscount(subtotal);
  const total = subtotal - discount > 0 ? subtotal - discount : 0;

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
                        <input type="text" value={item.quantity} readOnly className="qty-input" />
                        <button className="qty-btn" onClick={() => updateQuantity(item.productId._id, item.quantity + 1, item.color)}>+</button>
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
              
              {savedVoucherIds.length > 0 && (
                <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px dashed #eee" }}>
                  <label style={{ display: "block", marginBottom: "10px", fontWeight: "500", fontSize: "14px" }}>Chọn Voucher của bạn:</label>
                  <select 
                    value={selectedVoucherId} 
                    onChange={(e) => setSelectedVoucherId(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ddd", background: "#f9f9f9", outline: "none" }}
                  >
                    <option value="">Không chọn</option>
                    {savedVoucherIds.map(vid => {
                      const v = mockVouchers.find(mv => mv.id === vid);
                      if (!v) return null;
                      const isEligible = subtotal >= v.minOrder;
                      return (
                        <option key={vid} value={vid} disabled={!isEligible}>
                          {v.title} {isEligible ? "" : `(Cần mua thêm ${formatPrice(v.minOrder - subtotal)}đ)`}
                        </option>
                      );
                    })}
                  </select>
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

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontWeight: "bold", fontSize: "18px", color: "var(--primary)" }}>
                <span>Tổng cộng:</span>
                <span>{formatPrice(total)}đ</span>
              </div>
              <button className="primary-btn" style={{ width: "100%", padding: "12px", fontSize: "16px" }}>
                Mua Hàng
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default CartPage;
