import { useState, useEffect } from "react";
import AddProductForm from "./AddProductForm";
import { DATA_EVENTS, emitDataChanged, subscribeDataChanged } from "../../../utils/realtimeEvents";
import { getAuthToken } from "../../../utils/authStorage";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function StoreDashboard({ store, token, onStoreUpdate }) {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showFlashSaleModal, setShowFlashSaleModal] = useState(false);
  const [flashSaleData, setFlashSaleData] = useState({
    enable: false,
    startTime: "",
    endTime: "",
    flashSaleDiscountPercent: 0,
  });

  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      const [prodRes, revRes] = await Promise.all([
        fetch(`${apiUrl}/stores/${store._id}/products`),
        fetch(`${apiUrl}/stores/${store._id}/reviews`)
      ]);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.items || prodData || []);
      }
      if (revRes.ok) {
        const revData = await revRes.json();
        setReviews(revData.items || revData || []);
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
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", background: "var(--background-alt)" }}>
            <button
              style={{
                flex: 1, padding: "15px", background: "none", border: "none", borderBottom: activeTab === "products" ? "3px solid var(--primary)" : "3px solid transparent",
                fontWeight: activeTab === "products" ? "bold" : "normal", color: activeTab === "products" ? "var(--primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "16px"
              }}
              onClick={() => setActiveTab("products")}
            >
              Sản phẩm của tôi ({products.length})
            </button>
            <button
              style={{
                flex: 1, padding: "15px", background: "none", border: "none", borderBottom: activeTab === "reviews" ? "3px solid var(--primary)" : "3px solid transparent",
                fontWeight: activeTab === "reviews" ? "bold" : "normal", color: activeTab === "reviews" ? "var(--primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "16px"
              }}
              onClick={() => setActiveTab("reviews")}
            >
              Đánh giá của khách hàng ({reviews.length})
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
                               <span
                                 style={{
                                   background: p.isFlashSale ? "#dcfce7" : "#f1f5f9",
                                   color: p.isFlashSale ? "#16a34a" : "#64748b",
                                   padding: "4px 8px",
                                   borderRadius: "4px",
                                   fontSize: "12px",
                                   display: "inline-block",
                                   fontWeight: "500"
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
            ) : (
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
