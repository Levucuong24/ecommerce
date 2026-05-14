import { useState, useEffect } from "react";
import AddProductForm from "./AddProductForm";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function StoreDashboard({ store, token, onStoreUpdate }) {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

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
    }
  }, [store]);

  const formatPrice = (price) => {
    if (!price) return "0";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
                        <th style={{ padding: "12px" }}>Giá (VNĐ)</th>
                        <th style={{ padding: "12px" }}>Kho</th>
                        <th style={{ padding: "12px" }}>Đã bán</th>
                        <th style={{ padding: "12px" }}>Đánh giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                            {p.images?.[0] ? <img src={p.images[0]} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} /> : <div style={{ width: "40px", height: "40px", background: "#eee", borderRadius: "4px" }} />}
                            <span style={{ fontWeight: "500", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                          </td>
                          <td style={{ padding: "12px" }}>{formatPrice(p.discountPrice || p.price)}</td>
                          <td style={{ padding: "12px" }}>{p.stock}</td>
                          <td style={{ padding: "12px" }}>{p.soldCount || 0}</td>
                          <td style={{ padding: "12px" }}>
                            <span style={{ color: "var(--warning)" }}>★</span> {p.ratingAverage || 0} ({p.ratingCount || 0})
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
    </div>
  );
}

export default StoreDashboard;
