import { useState, useEffect } from "react";
import AddProductForm from "./AddProductForm";
import AnalyticsChart from "../../../components/AnalyticsChart";
import { DATA_EVENTS, emitDataChanged, subscribeDataChanged } from "../../../utils/realtimeEvents";
import { getAuthToken } from "../../../utils/authStorage";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getFlashSaleStatus = (product) => {
  const now = new Date();
  const startTime = product.flashSaleStartTime ? new Date(product.flashSaleStartTime) : null;
  const endTime = product.flashSaleEndTime ? new Date(product.flashSaleEndTime) : null;

  if (!product.isFlashSale || (endTime && endTime < now)) {
    return { label: "Tắt", background: "#f1f5f9", color: "#64748b" };
  }

  if (startTime && startTime > now) {
    return { label: "Sắp diễn ra", background: "#fef3c7", color: "#d97706" };
  }

  return { label: "Đang bật", background: "#dcfce7", color: "#16a34a" };
};

const FlashSaleStatusBadge = ({ product }) => {
  const status = getFlashSaleStatus(product);

  return (
    <span
      style={{
        background: status.background,
        color: status.color,
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        display: "inline-block",
        fontWeight: "500"
      }}
    >
      {status.label}
    </span>
  );
};

function StoreDashboard({ store, token, onStoreUpdate }) {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState("all");
  const [loadingData, setLoadingData] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showFlashSaleModal, setShowFlashSaleModal] = useState(false);
  const [flashSaleData, setFlashSaleData] = useState({
    enable: false,
    startTime: "",
    endTime: "",
    flashSaleDiscountPercent: 0,
  });

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "pending": return { background: "#fef9c3", color: "#a16207" };
      case "processing": return { background: "#dbeafe", color: "#1d4ed8" };
      case "completed": return { background: "#dcfce7", color: "#15803d" };
      case "cancelled": return { background: "#fee2e2", color: "#b91c1c" };
      default: return { background: "#f3f4f6", color: "#374151" };
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case "pending": return "Chờ xử lý";
      case "processing": return "Đang giao";
      case "completed": return "Đã hoàn thành";
      case "cancelled": return "Đã hủy";
      default: return status;
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const response = await fetch(`${apiUrl}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        alert("Cập nhật trạng thái đơn hàng thành công!");
        fetchDashboardData();
      } else {
        const err = await response.json();
        alert(err.message || "Lỗi khi cập nhật trạng thái");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi hệ thống");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    return o.orderStatus === orderFilter;
  });

  const completedOrders = orders.filter((o) => o.orderStatus === "completed");
  const completedSales = completedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const completedCommission = completedOrders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
  const completedRevenue = completedOrders.reduce((sum, o) => sum + (o.storeRevenue || 0), 0);

  const pendingOrdersList = orders.filter((o) => o.orderStatus === "pending" || o.orderStatus === "processing");
  const pendingSales = pendingOrdersList.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const pendingCommission = pendingOrdersList.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
  const pendingRevenue = pendingOrdersList.reduce((sum, o) => sum + (o.storeRevenue || 0), 0);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${apiUrl}/chats/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Lỗi tải cuộc hội thoại:", error);
    }
  };

  const fetchChatMessages = async (conv, showLoading = false) => {
    if (!conv) return;
    if (showLoading) setLoadingChats(true);
    try {
      const response = await fetch(`${apiUrl}/chats/${conv.storeId}?customerId=${conv.customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data);
      }
    } catch (error) {
      console.error("Lỗi tải tin nhắn cuộc trò chuyện:", error);
    } finally {
      if (showLoading) setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (activeTab === "messages") {
      fetchConversations();
      const interval = setInterval(() => {
        fetchConversations();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "messages" && selectedConv) {
      fetchChatMessages(selectedConv, true);
      const interval = setInterval(() => {
        fetchChatMessages(selectedConv, false);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedConv]);

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedConv) return;

    const content = chatInput;
    setChatInput("");

    try {
      const response = await fetch(`${apiUrl}/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeId: selectedConv.storeId,
          content,
          receiverId: selectedConv.customerId,
          senderRole: "staff",
        }),
      });

      if (response.ok) {
        fetchChatMessages(selectedConv, false);
        fetchConversations();
      }
    } catch (error) {
      console.error("Lỗi gửi tin nhắn phản hồi:", error);
    }
  };

  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      const [prodRes, revRes, orderRes] = await Promise.all([
        fetch(`${apiUrl}/stores/${store._id}/products`),
        fetch(`${apiUrl}/stores/${store._id}/reviews`),
        fetch(`${apiUrl}/orders/store`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ]);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.items || prodData || []);
      }
      if (revRes.ok) {
        const revData = await revRes.json();
        setReviews(revData.items || revData || []);
      }
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrders(orderData || []);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu dashboard:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (store?._id) {
      fetchDashboardData();

      // Lắng nghe sự kiện để cập nhật dữ liệu bảng điều khiển ngay lập tức
      const unsubscribe = subscribeDataChanged((event) => {
        if (event.type === DATA_EVENTS.PRODUCTS || event.type === DATA_EVENTS.STORES) {
          fetchDashboardData();
        }
      });

      return () => unsubscribe();
    }
  }, [store]);

  const formatPrice = (price) => {
    if (!price) return "0";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleFlashSaleClick = (product) => {
    setSelectedProduct(product);
    setFlashSaleData({
      enable: product.isFlashSale || false,
      startTime: product.flashSaleStartTime?.substring(0, 16) || "",
      endTime: product.flashSaleEndTime?.substring(0, 16) || "",
      flashSaleDiscountPercent: product.flashSaleDiscountPercent || 0,
    });
    setShowFlashSaleModal(true);
  };

  const handleFlashSaleSave = async () => {
    if (!selectedProduct) return;
    try {
      const response = await fetch(
        `${apiUrl}/products/${selectedProduct._id}/flash-sale`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(flashSaleData),
        }
      );
      if (response.ok) {
        alert("Cập nhật Flash Sale thành công!");
        setShowFlashSaleModal(false);
        fetchDashboardData();
        emitDataChanged(DATA_EVENTS.PRODUCTS, { productId: selectedProduct._id });
      } else {
        alert("Không thể cập nhật Flash Sale");
      }
    } catch (error) {
      console.error("Lỗi cập nhật Flash Sale:", error);
      alert("Lỗi cập nhật Flash Sale");
    }
  };

  return (
    <div className="store-dashboard">
      <div className="admin-table-wrapper" style={{ padding: "24px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3>{store.name}</h3>
            <p style={{ color: "#666" }}>{store.description}</p>
          </div>
          {store.logo && (
            <img 
              src={store.logo} 
              alt="Store Logo" 
              style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }} 
            />
          )}
        </div>
        <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
          <button 
            className="grant-btn" 
            style={{ background: "white", color: "var(--shopee-red)", border: "1px solid var(--shopee-red)" }}
            onClick={() => {/* Implement Edit Store */}}
          >
            Chỉnh sửa thông tin
          </button>
          <button 
            className="grant-btn"
            onClick={() => setShowAddProduct(!showAddProduct)}
          >
            {showAddProduct ? "Hủy" : "Thêm sản phẩm mới"}
          </button>
        </div>
      </div>

      {showAddProduct && (
        <AddProductForm 
          token={token} 
          onSuccess={() => {
            setShowAddProduct(false);
            // Optionally refresh product list
          }} 
        />
      )}

      {!showAddProduct && (
        <div className="admin-table-wrapper" style={{ padding: "0", overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", background: "var(--background-alt)", flexWrap: "wrap" }}>
            <button
              style={{
                flex: 1, minWidth: "120px", padding: "15px", background: "none", border: "none", borderBottom: activeTab === "products" ? "3px solid var(--primary)" : "3px solid transparent",
                fontWeight: activeTab === "products" ? "bold" : "normal", color: activeTab === "products" ? "var(--primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "16px"
              }}
              onClick={() => setActiveTab("products")}
            >
              Sản phẩm của tôi ({products.length})
            </button>
            <button
              style={{
                flex: 1, minWidth: "120px", padding: "15px", background: "none", border: "none", borderBottom: activeTab === "orders" ? "3px solid var(--primary)" : "3px solid transparent",
                fontWeight: activeTab === "orders" ? "bold" : "normal", color: activeTab === "orders" ? "var(--primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "16px"
              }}
              onClick={() => setActiveTab("orders")}
            >
              Đơn hàng ({orders.length})
            </button>
            <button
              style={{
                flex: 1, minWidth: "120px", padding: "15px", background: "none", border: "none", borderBottom: activeTab === "revenue" ? "3px solid var(--primary)" : "3px solid transparent",
                fontWeight: activeTab === "revenue" ? "bold" : "normal", color: activeTab === "revenue" ? "var(--primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "16px"
              }}
              onClick={() => setActiveTab("revenue")}
            >
              Doanh thu
            </button>
            <button
              style={{
                flex: 1, minWidth: "120px", padding: "15px", background: "none", border: "none", borderBottom: activeTab === "reviews" ? "3px solid var(--primary)" : "3px solid transparent",
                fontWeight: activeTab === "reviews" ? "bold" : "normal", color: activeTab === "reviews" ? "var(--primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "16px"
              }}
              onClick={() => setActiveTab("reviews")}
            >
              Đánh giá ({reviews.length})
            </button>
            <button
              style={{
                flex: 1, minWidth: "120px", padding: "15px", background: "none", border: "none", borderBottom: activeTab === "messages" ? "3px solid var(--primary)" : "3px solid transparent",
                fontWeight: activeTab === "messages" ? "bold" : "normal", color: activeTab === "messages" ? "var(--primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "16px"
              }}
              onClick={() => setActiveTab("messages")}
            >
              Tin nhắn
            </button>
          </div>

          <div style={{ padding: "24px" }}>
            {loadingData ? (
              <div style={{ textAlign: "center", padding: "40px" }}>Đang tải dữ liệu...</div>
            ) : activeTab === "products" ? (
              products.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ color: "var(--text-secondary)" }}>Chưa có sản phẩm nào được tạo.</p>
                  <button className="grant-btn" style={{ marginTop: "15px" }} onClick={() => setShowAddProduct(true)}>
                    Tạo sản phẩm đầu tiên
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                        <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-secondary)" }}>
                          <th style={{ padding: "12px" }}>Tên sản phẩm</th>
                          <th style={{ padding: "12px" }}>Màu sắc</th>
                          <th style={{ padding: "12px" }}>Giá (VNĐ)</th>
                          <th style={{ padding: "12px" }}>Flash Sale</th>
                          <th style={{ padding: "12px" }}>Kho</th>
                          <th style={{ padding: "12px" }}>Đã bán</th>
                          <th style={{ padding: "12px" }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                          <tr key={p._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                            <td style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                              {p.images?.[0] ? <img src={p.images[0]} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} /> : <div style={{ width: "40px", height: "40px", background: "#eee", borderRadius: "4px" }} />}
                              <span style={{ fontWeight: "500", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                            </td>
                            <td style={{ padding: "12px" }}>
                              {p.colors && p.colors.length > 0 ? (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
                                  {p.colors.map((c, idx) => (
                                    <div
                                      key={idx}
                                      title={`${c.name} · Giá: ${formatPrice(c.discountPrice || c.price)}₫ · Kho: ${c.stock}`}
                                      style={{
                                        width: "20px", height: "20px", borderRadius: "50%",
                                        background: c.hex || "#ccc",
                                        border: "2px solid rgba(0,0,0,0.15)",
                                        flexShrink: 0,
                                        cursor: "help",
                                      }}
                                    />
                                  ))}
                                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginLeft: "2px" }}>
                                    {p.colors.length} màu
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: "var(--text-muted, #94a3b8)", fontSize: "12px" }}>—</span>
                              )}
                            </td>
                             <td style={{ padding: "12px" }}>
                               {p.colors && p.colors.length > 0 ? (() => {
                                 const prices = p.colors.map(c => c.discountPrice || c.price);
                                 const min = Math.min(...prices);
                                 const max = Math.max(...prices);
                                 return min === max
                                   ? <span style={{ color: "var(--shopee-red)", fontWeight: "500" }}>{formatPrice(min)}</span>
                                   : <span style={{ color: "var(--shopee-red)", fontWeight: "500" }}>{formatPrice(min)} – {formatPrice(max)}</span>;
                               })() : formatPrice(p.discountPrice || p.price)}
                             </td>
                             <td style={{ padding: "12px" }}>
                               <FlashSaleStatusBadge product={p} />
                               <span
                                 style={{
                                   background: p.isFlashSale ? "#dcfce7" : "#f1f5f9",
                                   color: p.isFlashSale ? "#16a34a" : "#64748b",
                                   padding: "4px 8px",
                                   borderRadius: "4px",
                                   fontSize: "12px",
                                   fontWeight: "500",
                                   display: "none"
                                 }}
                               >
                                 {p.isFlashSale ? "Đang bật" : "Tắt"}
                               </span>
                             </td>
                             <td style={{ padding: "12px" }}>{p.stock}</td>
                             <td style={{ padding: "12px" }}>{p.soldCount || 0}</td>
                             <td style={{ padding: "12px" }}>
                               <button 
                                 className="grant-btn" 
                                 style={{ padding: "6px 12px", fontSize: "12px" }}
                                 onClick={() => handleFlashSaleClick(p)}
                               >
                                 Flash Sale
                               </button>
                             </td>
                           </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : activeTab === "reviews" ? (
              reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ color: "var(--text-secondary)" }}>Chưa có đánh giá nào từ khách hàng.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-secondary)" }}>
                        <th style={{ padding: "12px" }}>Khách hàng</th>
                        <th style={{ padding: "12px" }}>Sản phẩm</th>
                        <th style={{ padding: "12px" }}>Đánh giá</th>
                        <th style={{ padding: "12px" }}>Bình luận</th>
                        <th style={{ padding: "12px" }}>Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map(r => (
                        <tr key={r._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "12px", fontWeight: "500" }}>{r.userId?.name || "Người dùng"}</td>
                          <td style={{ padding: "12px", maxWidth: "150px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={r.productId?.name}>{r.productId?.name || "Sản phẩm"}</td>
                          <td style={{ padding: "12px", color: "var(--warning)" }}>{"★".repeat(r.rating)}</td>
                          <td style={{ padding: "12px", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.comment}>{r.comment}</td>
                          <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.9em" }}>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : activeTab === "orders" ? (
              <div>
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                  {["all", "pending", "processing", "completed", "cancelled"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setOrderFilter(status)}
                      style={{
                        padding: "8px 16px",
                        border: "1px solid #cbd5e1",
                        background: orderFilter === status ? "var(--primary)" : "white",
                        color: orderFilter === status ? "white" : "#475569",
                        borderRadius: "20px",
                        cursor: "pointer",
                        fontWeight: "500",
                        fontSize: "13px"
                      }}
                    >
                      {status === "all" ? "Tất cả" : status === "pending" ? "Chờ xử lý" : status === "processing" ? "Đang giao" : status === "completed" ? "Đã hoàn thành" : "Đã hủy"}
                    </button>
                  ))}
                </div>
                {filteredOrders.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>Chưa có đơn hàng nào.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {filteredOrders.map((ord) => (
                      <div key={ord._id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", background: "white", padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", alignItems: "center" }}>
                          <div>
                            <span style={{ fontWeight: "bold" }}>Mã đơn:</span> <span style={{ color: "var(--primary)", fontWeight: "500" }}>{ord._id}</span>
                            <span style={{ margin: "0 10px", color: "#cbd5e1" }}>|</span>
                            <span style={{ color: "#64748b", fontSize: "13px" }}>{new Date(ord.createdAt).toLocaleString("vi-VN")}</span>
                          </div>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: getStatusBadgeStyle(ord.orderStatus).background,
                            color: getStatusBadgeStyle(ord.orderStatus).color
                          }}>
                            {translateStatus(ord.orderStatus)}
                          </span>
                        </div>
                        
                        {/* Customer & Address */}
                        <div style={{ fontSize: "13px", color: "#334155", marginBottom: "15px", background: "#f8fafc", padding: "10px", borderRadius: "4px", lineHeight: "1.6" }}>
                          <strong>Khách hàng:</strong> {ord.userId?.name || "Khách vãng lai"} ({ord.userId?.email}) <br />
                          <strong>Người nhận:</strong> {ord.addressSnapshot?.fullName} ({ord.addressSnapshot?.phone}) <br />
                          <strong>Địa chỉ giao:</strong> {ord.addressSnapshot?.detail}
                        </div>

                        {/* Items */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "15px" }}>
                          {ord.items.map((item, idx) => (
                            <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                              <img src={item.image || "/images/cart.png"} alt={item.name} style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "4px" }} />
                              <div style={{ flex: 1, fontSize: "14px" }}>
                                <div style={{ fontWeight: "500" }}>{item.name}</div>
                                {item.color && <div style={{ fontSize: "11px", color: "#888" }}>Phân loại: {item.color}</div>}
                              </div>
                              <div style={{ fontSize: "13px", color: "#64748b" }}>
                                {formatPrice(item.price)}đ x {item.quantity}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Financials Breakdown */}
                        <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "12px", fontSize: "13px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "15px" }}>
                          <div>
                            <span style={{ color: "#64748b" }}>Thanh toán: </span>
                            <strong style={{ fontSize: "15px" }}>{formatPrice(ord.totalPrice)}đ</strong>
                          </div>
                          <div>
                            <span style={{ color: "#ef4444" }}>Phí sàn (5%): </span>
                            <strong>-{formatPrice(ord.commissionAmount)}đ</strong>
                          </div>
                          <div>
                            <span style={{ color: "#10b981" }}>Thực nhận: </span>
                            <strong style={{ fontSize: "16px", color: "#10b981" }}>{formatPrice(ord.storeRevenue)}đ</strong>
                          </div>
                        </div>

                        {/* Actions */}
                        {(ord.orderStatus === "pending" || ord.orderStatus === "processing") && (
                          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "15px" }}>
                            {ord.orderStatus === "pending" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(ord._id, "cancelled")}
                                  style={{ padding: "6px 12px", background: "none", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
                                >
                                  Hủy đơn
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(ord._id, "processing")}
                                  style={{ padding: "6px 12px", background: "var(--primary)", border: "none", color: "white", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
                                >
                                  Xác nhận & Gửi hàng
                                </button>
                              </>
                            )}
                            {ord.orderStatus === "processing" && (
                              <button
                                onClick={() => handleUpdateStatus(ord._id, "completed")}
                                style={{ padding: "6px 12px", background: "#10b981", border: "none", color: "white", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
                              >
                                Giao thành công
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "revenue" ? (
              <div>
                {/* Stats Cards Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                  <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "600" }}>Doanh Số Đã Đóng</span>
                      <span style={{ fontSize: "24px" }}>💰</span>
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: "bold", color: "#0f172a" }}>{formatPrice(completedSales)}đ</div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "5px" }}>Từ {completedOrders.length} đơn hàng đã hoàn thành</div>
                  </div>
                  <div style={{ background: "#fff5f5", padding: "20px", borderRadius: "8px", border: "1px solid #fee2e2" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontSize: "14px", color: "#b91c1c", fontWeight: "600" }}>Phí dịch vụ sàn (5%)</span>
                      <span style={{ fontSize: "24px" }}>🛡️</span>
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: "bold", color: "#b91c1c" }}>-{formatPrice(completedCommission)}đ</div>
                    <div style={{ fontSize: "12px", color: "#b91c1c", marginTop: "5px" }}>Phí Admin thu trên doanh số đóng</div>
                  </div>
                  <div style={{ background: "#ecfdf5", padding: "20px", borderRadius: "8px", border: "1px solid #d1fae5" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontSize: "14px", color: "#065f46", fontWeight: "600" }}>Doanh Thu Thực Nhận</span>
                      <span style={{ fontSize: "24px" }}>💸</span>
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: "bold", color: "#059669" }}>{formatPrice(completedRevenue)}đ</div>
                    <div style={{ fontSize: "12px", color: "#065f46", marginTop: "5px" }}>Tổng tiền sau chiết khấu</div>
                  </div>
                </div>

                <AnalyticsChart orders={orders} type="store" />

                {/* Pending Section */}
                <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "30px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#334155" }}>Doanh thu đang chờ xử lý (Chưa giao hàng)</h4>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "20px", fontSize: "14px" }}>
                    <div>Số đơn hàng: <strong>{pendingOrdersList.length} đơn</strong></div>
                    <div>Dự kiến doanh số: <strong>{formatPrice(pendingSales)}đ</strong></div>
                    <div>Dự kiến phí sàn (5%): <strong style={{ color: "#ef4444" }}>-{formatPrice(pendingCommission)}đ</strong></div>
                    <div>Dự kiến thực nhận (95%): <strong style={{ color: "#10b981" }}>{formatPrice(pendingRevenue)}đ</strong></div>
                  </div>
                </div>

                {/* Sales list breakdown */}
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", background: "white", overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "bold" }}>Lịch sử giao dịch chi tiết</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#fafafa", borderBottom: "1px solid #cbd5e1" }}>
                        <th style={{ padding: "12px" }}>Mã đơn hàng</th>
                        <th style={{ padding: "12px" }}>Ngày tạo</th>
                        <th style={{ padding: "12px" }}>Trạng thái</th>
                        <th style={{ padding: "12px" }}>Tổng thanh toán</th>
                        <th style={{ padding: "12px" }}>Chiết khấu sàn (5%)</th>
                        <th style={{ padding: "12px" }}>Thực nhận (95%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "12px" }}>{o._id}</td>
                          <td style={{ padding: "12px" }}>{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                          <td style={{ padding: "12px" }}>
                            <span style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "600",
                              background: getStatusBadgeStyle(o.orderStatus).background,
                              color: getStatusBadgeStyle(o.orderStatus).color
                            }}>
                              {translateStatus(o.orderStatus)}
                            </span>
                          </td>
                          <td style={{ padding: "12px" }}>{formatPrice(o.totalPrice)}đ</td>
                          <td style={{ padding: "12px", color: "#ef4444" }}>-{formatPrice(o.commissionAmount)}đ</td>
                          <td style={{ padding: "12px", color: "#10b981", fontWeight: "bold" }}>{formatPrice(o.storeRevenue)}đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", height: "500px", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
                {/* Conversation List */}
                <div style={{ width: "280px", borderRight: "1px solid var(--border-color)", background: "#f8fafc", display: "flex", flexDirection: "column", overflowY: "auto" }}>
                  <div style={{ padding: "16px", fontWeight: "bold", borderBottom: "1px solid var(--border-color)", background: "white" }}>
                    Hội thoại gần đây
                  </div>
                  {conversations.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                      Chưa có tin nhắn nào từ khách hàng.
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const isActive = selectedConv?.customerId === conv.customerId;
                      return (
                        <div
                          key={`${conv.storeId}_${conv.customerId}`}
                          onClick={() => setSelectedConv(conv)}
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #f1f5f9",
                            cursor: "pointer",
                            background: isActive ? "#fff5f5" : "transparent",
                            transition: "background 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.background = "#f1f5f9";
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "var(--primary-light)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "bold",
                              fontSize: "15px",
                              color: "var(--shopee-red)",
                              overflow: "hidden",
                              flexShrink: 0,
                            }}
                          >
                            {conv.customerAvatar ? (
                              <img src={conv.customerAvatar} alt={conv.customerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <span>{conv.customerName[0]?.toUpperCase()}</span>
                            )}
                          </div>
                          <div style={{ overflow: "hidden", flex: 1 }}>
                            <div style={{ fontWeight: "600", fontSize: "14px", color: "#1e293b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                              {conv.customerName}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", marginTop: "2px" }}>
                              {conv.lastMessage}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Chat Panel */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white" }}>
                  {selectedConv ? (
                    <>
                      {/* Chat Header */}
                      <div style={{ padding: "16px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "var(--primary-light)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            color: "var(--shopee-red)",
                            overflow: "hidden"
                          }}
                        >
                          {selectedConv.customerAvatar ? (
                            <img src={selectedConv.customerAvatar} alt={selectedConv.customerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span>{selectedConv.customerName[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <span style={{ fontWeight: "600", color: "#1e293b" }}>{selectedConv.customerName}</span>
                      </div>

                      {/* Messages Thread */}
                      <div style={{ flex: 1, padding: "20px", overflowY: "auto", background: "#f8fafc", display: "flex", flexDirection: "column", gap: "12px" }}>
                        {loadingChats && chatMessages.length === 0 ? (
                          <div style={{ textAlign: "center", color: "#64748b", marginTop: "40px" }}>Đang tải tin nhắn...</div>
                        ) : (
                          chatMessages.map((msg, index) => {
                            const isMe = msg.senderRole === "staff";
                            return (
                              <div
                                key={msg._id || index}
                                style={{
                                  display: "flex",
                                  justifyContent: isMe ? "flex-end" : "flex-start",
                                }}
                              >
                                <div
                                  style={{
                                    maxWidth: "70%",
                                    padding: "10px 14px",
                                    borderRadius: isMe ? "12px 12px 0 12px" : "12px 12px 12px 0",
                                    background: isMe ? "var(--shopee-red, #ee4d2d)" : "white",
                                    color: isMe ? "white" : "#1e293b",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                    fontSize: "14px",
                                    lineHeight: "1.4",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {msg.content}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Reply Form */}
                      <form
                        onSubmit={handleSendChatMessage}
                        style={{ padding: "16px", borderTop: "1px solid var(--border-color)", display: "flex", gap: "10px" }}
                      >
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={`Trả lời ${selectedConv.customerName}...`}
                          style={{
                            flex: 1,
                            padding: "10px 14px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                        <button
                          type="submit"
                          style={{
                            background: "var(--shopee-red, #ee4d2d)",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            padding: "10px 20px",
                            fontWeight: "600",
                            fontSize: "14px",
                            cursor: "pointer",
                          }}
                        >
                          Trả lời
                        </button>
                      </form>
                    </>
                  ) : (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#64748b", padding: "40px", textAlign: "center" }}>
                      <span style={{ fontSize: "48px", marginBottom: "16px" }}>💬</span>
                      <p style={{ fontWeight: "500", fontSize: "16px" }}>Hộp thư của cửa hàng</p>
                      <p style={{ fontSize: "14px", color: "#94a3b8", marginTop: "4px" }}>Chọn khách hàng từ cột bên trái để xem tin nhắn và trả lời.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showFlashSaleModal && (
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
          onClick={() => setShowFlashSaleModal(false)}
        >
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "20px" }}>Quản lý Flash Sale</h3>
            <p style={{ fontWeight: "500", marginBottom: "20px", color: "var(--shopee-red)" }}>{selectedProduct?.name}</p>
            
            <div style={{ marginTop: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={flashSaleData.enable}
                  onChange={(e) =>
                    setFlashSaleData({ ...flashSaleData, enable: e.target.checked })
                  }
                  style={{ width: "18px", height: "18px" }}
                />
                <span style={{ fontSize: "15px", fontWeight: "500" }}>Kích hoạt Flash Sale</span>
              </label>
              
              {flashSaleData.enable && (
                <div className="animate-fade">
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "5px" }}>Phần trăm giảm giá (%):</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={flashSaleData.flashSaleDiscountPercent || ""}
                      onChange={(e) =>
                        setFlashSaleData({ ...flashSaleData, flashSaleDiscountPercent: Number(e.target.value) })
                      }
                      placeholder="Nhập % giảm giá (ví dụ: 10, 20...)"
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "14px"
                      }}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "5px" }}>Thời gian bắt đầu:</label>
                    <input
                      type="datetime-local"
                      value={flashSaleData.startTime}
                      onChange={(e) =>
                        setFlashSaleData({ ...flashSaleData, startTime: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: "25px" }}>
                    <label style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "5px" }}>Thời gian kết thúc:</label>
                    <input
                      type="datetime-local"
                      value={flashSaleData.endTime}
                      onChange={(e) =>
                        setFlashSaleData({ ...flashSaleData, endTime: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  className="revoke-btn"
                  onClick={() => setShowFlashSaleModal(false)}
                  style={{ padding: "10px 20px" }}
                >
                  Hủy
                </button>
                <button
                  className="grant-btn"
                  onClick={handleFlashSaleSave}
                  style={{ padding: "10px 25px" }}
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoreDashboard;
