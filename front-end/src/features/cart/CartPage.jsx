import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";
import { getAuthToken } from "../../utils/authStorage";
import { imageMap } from "../home/utils";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const currencyFormatter = new Intl.NumberFormat("vi-VN");

const formatPrice = (price) => {
  return currencyFormatter.format(price);
};

function CartPage({ user, onLogout, onOpenLogin, onBackHome }) {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const response = await fetch(`${apiUrl}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ productId, quantity: newQuantity, replace: true }),
      });
      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng:", error);
    }
  };

  // Note: Since my backend logic ADDS quantity in POST /, I might need a separate update endpoint or change logic.
  // Actually, for simplicity, I'll just use a "SET" logic if I had one, but I'll stick to what I have or fix it.
  // Wait, my backend logic is: cart.items[itemIndex].quantity += quantity;
  // So to set to 5 if it's 3, I need to send quantity: 2.
  // Let's fix the backend to have a "update quantity" endpoint.

  const removeItem = async (productId) => {
    try {
      const response = await fetch(`${apiUrl}/cart/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
    }
  };

  const calculateTotal = () => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => {
      const price = item.productId.discountPrice || item.productId.price || 0;
      return sum + price * item.quantity;
    }, 0);
  };

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
              <div className="cart-header-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", padding: "15px", borderBottom: "1px solid #eee", fontSize: "14px", color: "#888" }}>
                <span>Sản Phẩm</span>
                <span style={{ textAlign: "center" }}>Đơn Giá</span>
                <span style={{ textAlign: "center" }}>Số Lượng</span>
                <span style={{ textAlign: "center" }}>Số Tiền</span>
                <span style={{ textAlign: "center" }}>Thao Tác</span>
              </div>
              
              {cart.items.map((item) => (
                <div key={item.productId._id} className="cart-item-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", padding: "20px 15px", alignItems: "center", borderBottom: "1px solid #eee" }}>
                  <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                    <img 
                      src={imageMap[item.productId.images?.[0]] || item.productId.images?.[0]} 
                      alt={item.productId.name} 
                      style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "4px" }}
                    />
                    <div style={{ fontSize: "14px", fontWeight: "500" }}>{item.productId.name}</div>
                  </div>
                  
                  <div style={{ textAlign: "center" }}>
                    {item.productId.discountPrice ? (
                      <div>
                        <div style={{ color: "#888", textDecoration: "line-through", fontSize: "12px" }}>{formatPrice(item.productId.price)}đ</div>
                        <div style={{ fontWeight: "500" }}>{formatPrice(item.productId.discountPrice)}đ</div>
                      </div>
                    ) : (
                      <div style={{ fontWeight: "500" }}>{formatPrice(item.productId.price)}đ</div>
                    )}
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="quantity-selector" style={{ scale: "0.8" }}>
                      <button className="qty-btn" onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}>-</button>
                      <input type="text" value={item.quantity} readOnly className="qty-input" />
                      <button className="qty-btn" onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: "center", color: "var(--primary)", fontWeight: "600" }}>
                    {formatPrice((item.productId.discountPrice || item.productId.price) * item.quantity)}đ
                  </div>
                  
                  <div style={{ textAlign: "center" }}>
                    <button 
                      onClick={() => removeItem(item.productId._id)}
                      style={{ background: "none", color: "#555", cursor: "pointer", fontSize: "14px" }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary-panel" style={{ background: "white", padding: "20px", borderRadius: "8px", height: "fit-content", position: "sticky", top: "174px" }}>
              <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>Tổng Thanh Toán</h3>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <span>Tổng tiền hàng:</span>
                <span>{formatPrice(calculateTotal())}đ</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontWeight: "bold", fontSize: "18px", color: "var(--primary)" }}>
                <span>Tổng cộng:</span>
                <span>{formatPrice(calculateTotal())}đ</span>
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
