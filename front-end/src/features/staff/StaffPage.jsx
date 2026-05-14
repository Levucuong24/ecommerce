import { useState, useEffect } from "react";
import AdminHeader from "../admin/components/AdminHeader";
import { getMyStore } from "./services/storeApi";
import StoreSetup from "./components/StoreSetup";
import StoreDashboard from "./components/StoreDashboard";

function StaffPage({ user, handleLogout }) {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const token = localStorage.getItem("token");
        const data = await getMyStore(token);
        setStore(data);
      } catch (err) {
        console.error("Error fetching store:", err);
        setError("Không thể tải thông tin cửa hàng");
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === "staff") {
      fetchStore();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="admin-page-wrapper home-page shopee-inspired">
        <AdminHeader user={user} onLogout={handleLogout} />
        <div className="error-screen admin-container">
          <h2>Vui lòng đăng nhập</h2>
          <p>Bạn cần đăng nhập bằng tài khoản staff để truy cập trang này.</p>
          <button className="grant-btn" onClick={() => (window.location.href = "/auth")}>
            Đi đến trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== "staff") {
    return (
      <div className="admin-page-wrapper home-page shopee-inspired">
        <AdminHeader user={user} onLogout={handleLogout} />
        <div className="error-screen admin-container">
          <h2>Truy cập bị từ chối</h2>
          <p>Trang này chỉ dành cho tài khoản staff.</p>
          <button className="grant-btn" onClick={() => (window.location.href = "/home")}>
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-wrapper admin-page-main">
      <AdminHeader user={user} onLogout={handleLogout} />
      <main>
        <div className="admin-banner">
          <div className="admin-banner-content animate-fade">
            <h1>Kênh Người Bán</h1>
            <p>Quản lý cửa hàng và sản phẩm của bạn một cách chuyên nghiệp.</p>
          </div>
        </div>

        <div className="content-shell admin-container">
          {loading ? (
            <div className="admin-table-wrapper" style={{ padding: "100px 24px", textAlign: "center" }}>
              <div className="loader" style={{ margin: "0 auto 20px" }}></div>
              <p>Đang tải thông tin cửa hàng...</p>
            </div>
          ) : error ? (
            <div className="admin-table-wrapper animate-fade" style={{ padding: "40px", textAlign: "center" }}>
              <p style={{ color: "#ef4444", marginBottom: "20px" }}>{error}</p>
              <button className="grant-btn" onClick={() => window.location.reload()}>Thử lại</button>
            </div>
          ) : !store ? (
            <div className="animate-fade">
              <StoreSetup token={localStorage.getItem("token")} onStoreCreated={(newStore) => setStore(newStore)} />
            </div>
          ) : store.status === "pending" ? (
            <div className="admin-table-wrapper animate-fade" style={{ padding: "60px 40px", textAlign: "center" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px" }}>⏳</div>
              <h3 style={{ fontSize: "1.8rem", marginBottom: "15px" }}>Cửa hàng đang chờ duyệt</h3>
              <p style={{ color: "#64748b", maxWidth: "500px", margin: "0 auto", lineHeight: "1.6" }}>
                Yêu cầu tạo cửa hàng <strong style={{ color: "var(--text-main)" }}>"{store.name}"</strong> của bạn đã được gửi đi. 
                Vui lòng đợi quản trị viên phê duyệt để bắt đầu bán hàng.
              </p>
              <button 
                className="revoke-btn" 
                style={{ marginTop: "30px", padding: "12px 30px" }}
                onClick={() => window.location.reload()}
              >
                🔄 Kiểm tra lại trạng thái
              </button>
            </div>
          ) : (
            <div className="animate-fade">
              <StoreDashboard store={store} token={localStorage.getItem("token")} onStoreUpdate={(updatedStore) => setStore(updatedStore)} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default StaffPage;
