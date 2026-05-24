import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../home/components/Header";
import { getAuthToken } from "../../utils/authStorage";
import { imageMap } from "../home/utils";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function OrderHistoryPage({ user, onLogout, onOpenLogin, onOpenCart }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/orders/my`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Lỗi khi tải lịch sử đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;

    try {
      const response = await fetch(`${apiUrl}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (response.ok) {
        alert("Đã hủy đơn hàng thành công!");
        fetchOrders();
      } else {
        const data = await response.json();
        alert(data.message || "Không thể hủy đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      alert("Đã xảy ra lỗi khi hủy đơn hàng");
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "pending":
        return { background: "#fef9c3", color: "#a16207" }; // yellow
      case "processing":
        return { background: "#dbeafe", color: "#1d4ed8" }; // blue
      case "completed":
        return { background: "#dcfce7", color: "#15803d" }; // green
      case "cancelled":
        return { background: "#fee2e2", color: "#b91c1c" }; // red
      default:
        return { background: "#f3f4f6", color: "#374151" };
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "processing":
        return "Đang giao hàng";
      case "completed":
        return "Đã hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  return (
    <div className="order-history-page shopee-inspired">
      <Header
        user={user}
        onOpenLogin={onOpenLogin}
        onOpenCart={onOpenCart}
        onLogout={onLogout}
        onSearch={() => navigate("/home")}
      />
      <main className="content-shell following-shops-content" style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
        <div 
          className="back-to-home" 
          onClick={() => navigate("/home")}
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "5px", 
            color: "var(--text-secondary)", 
            cursor: "pointer", 
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Quay lại Trang Chủ
        </div>
        
        <h2 style={{ marginBottom: "24px" }}>Đơn Mua Của Tôi</h2>

        {!user ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "15px" }}>Vui lòng đăng nhập để xem đơn hàng</p>
            <button className="primary-btn" onClick={onOpenLogin}>Đăng Nhập</button>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>Đang tải...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", background: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>📦</div>
            <p style={{ color: "var(--text-secondary)" }}>Bạn chưa có đơn mua nào.</p>
            <button className="primary-btn" style={{ marginTop: "15px" }} onClick={() => navigate("/home")}>Mua sắm ngay</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {orders.map((order) => {
              const badge = getStatusBadgeStyle(order.orderStatus);
              return (
                <div key={order._id} style={{ background: "white", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden", border: "1px solid #f0f0f0" }}>
                  {/* Shop Info & Status Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f5f5f5", background: "#fafafa" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>
                        🏪 {order.storeId?.name || "Cửa hàng"}
                      </span>
                    </div>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: badge.background,
                      color: badge.color
                    }}>
                      {translateStatus(order.orderStatus)}
                    </span>
                  </div>

                  {/* Items List */}
                  <div style={{ padding: "0 20px" }}>
                    {order.items.map((item, idx) => {
                      const displayImg = imageMap[item.image] || item.image || "/images/cart.png";
                      return (
                        <div key={idx} style={{ display: "flex", gap: "15px", padding: "15px 0", borderBottom: idx === order.items.length - 1 ? "none" : "1px solid #f5f5f5" }}>
                          <img 
                            src={displayImg} 
                            alt={item.name} 
                            style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "4px" }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "4px" }}>{item.name}</div>
                            {item.color && (
                              <div style={{ fontSize: "12px", color: "var(--primary)", background: "#fff5f5", padding: "1px 6px", borderRadius: "3px", display: "inline-block", fontWeight: "600", marginBottom: "6px" }}>
                                Phân loại: {item.color}
                              </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                              <span style={{ color: "#888" }}>Số lượng: x{item.quantity}</span>
                              <span style={{ fontWeight: "600", color: "#333" }}>{formatPrice(item.price)}đ</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Shipping Address snapshot */}
                  <div style={{ padding: "12px 20px", background: "#fcfcfc", borderTop: "1px solid #f5f5f5", fontSize: "13px", color: "#555" }}>
                    <div style={{ fontWeight: "600", color: "#333", marginBottom: "4px" }}>📍 Địa chỉ nhận hàng:</div>
                    <div>
                      <strong>{order.addressSnapshot?.fullName}</strong> ({order.addressSnapshot?.phone}) - {order.addressSnapshot?.detail}
                    </div>
                  </div>

                  {/* Footer Stats & Actions */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderTop: "1px solid #f5f5f5" }}>
                    <div>
                      <span style={{ fontSize: "13px", color: "#888" }}>Hình thức: {order.paymentMethod === "COD" ? "Thanh toán khi nhận hàng (COD)" : order.paymentMethod}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "13px", color: "#555", marginRight: "5px" }}>Thành tiền:</span>
                        <span style={{ fontSize: "18px", fontWeight: "bold", color: "var(--primary)" }}>{formatPrice(order.totalPrice)}đ</span>
                      </div>
                      {order.orderStatus === "pending" && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          style={{
                            padding: "6px 12px",
                            background: "none",
                            border: "1px solid #ef4444",
                            color: "#ef4444",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "500",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "#fee2e2";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "none";
                          }}
                        >
                          Hủy Đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default OrderHistoryPage;
