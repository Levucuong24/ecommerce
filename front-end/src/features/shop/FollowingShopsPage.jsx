import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../home/components/Header";
import { getAuthToken } from "../../utils/authStorage";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function FollowingShopsPage({ user, onLogout, onOpenLogin, onOpenCart }) {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowingShops = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/stores/following`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setShops(data);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách shop:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFollowingShops();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleUnfollow = async (storeId) => {
    try {
      const response = await fetch(`${apiUrl}/stores/${storeId}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        // Tải lại danh sách
        fetchFollowingShops();
      }
    } catch (error) {
      console.error("Lỗi khi hủy theo dõi:", error);
    }
  };

  const handleSearch = () => {
    navigate("/home");
  };

  return (
    <div className="following-shops-page shopee-inspired">
      <Header
        user={user}
        onOpenLogin={onOpenLogin}
        onOpenCart={onOpenCart}
        onLogout={onLogout}
        onSearch={handleSearch}
      />
      <main className="content-shell following-shops-content">
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
            fontWeight: "500",
            transition: "color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Quay lại Trang Chủ
        </div>
        <h2 style={{ marginBottom: "20px", color: "var(--text-main)" }}>Shop Đang Theo Dõi</h2>

        {!user ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "15px" }}>Vui lòng đăng nhập để xem danh sách</p>
            <button className="primary-btn" onClick={onOpenLogin}>Đăng Nhập</button>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>Đang tải...</div>
        ) : shops.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0", background: "var(--surface)", borderRadius: "8px" }}>
            <p style={{ color: "var(--text-secondary)" }}>Bạn chưa theo dõi cửa hàng nào.</p>
            <button className="primary-btn" style={{ marginTop: "15px" }} onClick={() => navigate("/home")}>Tiếp tục mua sắm</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {shops.map((shop) => (
              <div key={shop._id} style={{ display: "flex", alignItems: "center", background: "var(--surface)", padding: "20px", borderRadius: "8px", boxShadow: "var(--shadow-sm)" }}>
                <div 
                  style={{ width: "60px", height: "60px", borderRadius: "50%", background: "var(--background-alt)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", marginRight: "15px", flexShrink: 0 }}
                  onClick={() => navigate(`/shop/${shop._id}`)}
                >
                  {shop.logo ? <img src={shop.logo} alt={shop.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "24px", color: "var(--text-secondary)", fontWeight: "bold" }}>{shop.name?.[0]?.toUpperCase()}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 
                    style={{ margin: "0 0 5px 0", fontSize: "16px", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    onClick={() => navigate(`/shop/${shop._id}`)}
                  >
                    {shop.name}
                  </h3>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "10px" }}>{shop.followerCount || 0} Người theo dõi</div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button 
                      className="shop-view-btn" 
                      onClick={() => navigate(`/shop/${shop._id}`)}
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      Xem Shop
                    </button>
                    <button 
                      className="shop-view-btn" 
                      onClick={() => handleUnfollow(shop._id)}
                      style={{ padding: "6px 12px", fontSize: "12px", background: "var(--background-alt)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
                    >
                      Đang Theo Dõi
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default FollowingShopsPage;
