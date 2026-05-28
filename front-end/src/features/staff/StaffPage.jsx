import { useCallback, useEffect, useState } from "react";
import AdminHeader from "../admin/components/AdminHeader";
import { getMyStore } from "./services/storeApi";
import StoreSetup from "./components/StoreSetup";
import StoreDashboard from "./components/StoreDashboard";
import { getAuthToken } from "../../utils/authStorage";
import { DATA_EVENTS, emitDataChanged, subscribeDataChanged } from "../../utils/realtimeEvents";

function StaffPage({ user, handleLogout, refreshUserProfile }) {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStore = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);

    try {
      const data = await getMyStore(getAuthToken());
      setStore(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching store:", err);
      setError("Khong the tai thong tin cua hang");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "staff" || user?.role === "customer") {
      fetchStore();
    }
  }, [user, fetchStore]);

  useEffect(() => {
    if (user?.role !== "staff" && user?.role !== "customer") return undefined;

    return subscribeDataChanged((event) => {
      if (event?.type === DATA_EVENTS.STORES) {
        fetchStore({ showLoading: false });
      }
    });
  }, [user, fetchStore]);

  useEffect(() => {
    if (user?.role === "staff") {
      const updateStatus = async (isOnline, emit = true) => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
          await fetch(`${apiUrl}/stores/online-status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({ isOnline }),
            keepalive: true,
          });
          
          if (emit) {
            // Phát sự kiện để các tab khác (ví dụ: trang sản phẩm) biết Shop đã online
            emitDataChanged(DATA_EVENTS.STORES, { isOnline });
          }
        } catch (err) {
          console.error("Error updating online status:", err);
        }
      };

      // Set online status initially
      updateStatus(true, true);

      // Heartbeat ping every 30 seconds to update lastActive
      const interval = setInterval(() => {
        updateStatus(true, false);
      }, 30000);
      
      // Update status to offline when leaving the page
      return () => {
        clearInterval(interval);
        updateStatus(false, true);
      };
    }
    return undefined;
  }, [user]);

  if (!user) {
    return (
      <div className="admin-page-wrapper home-page shopee-inspired">
        <AdminHeader user={user} onLogout={handleLogout} />
        <div className="error-screen admin-container">
          <h2>Vui long dang nhap</h2>
          <p>Ban can dang nhap bang tai khoan staff de truy cap trang nay.</p>
          <button className="grant-btn" onClick={() => (window.location.href = "/auth")}>
            Di den trang dang nhap
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== "staff" && user.role !== "customer") {
    return (
      <div className="admin-page-wrapper home-page shopee-inspired">
        <AdminHeader user={user} onLogout={handleLogout} />
        <div className="error-screen admin-container">
          <h2>Truy cap bi tu choi</h2>
          <p>Trang nay chi danh cho tai khoan staff hoac customer.</p>
          <button className="grant-btn" onClick={() => (window.location.href = "/home")}>
            Quay lai trang chu
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
            <h1>Kenh Nguoi Ban</h1>
            <p>Quan ly cua hang va san pham cua ban mot cach chuyen nghiep.</p>
          </div>
        </div>

        <div className="content-shell admin-container">
          {loading ? (
            <div className="admin-table-wrapper" style={{ padding: "100px 24px", textAlign: "center" }}>
              <div className="loader" style={{ margin: "0 auto 20px" }}></div>
              <p>Dang tai thong tin cua hang...</p>
            </div>
          ) : error ? (
            <div className="admin-table-wrapper animate-fade" style={{ padding: "40px", textAlign: "center" }}>
              <p style={{ color: "#ef4444", marginBottom: "20px" }}>{error}</p>
              <button className="grant-btn" onClick={() => fetchStore()}>Thu lai</button>
            </div>
          ) : !store ? (
            <div className="animate-fade">
              <StoreSetup token={getAuthToken()} onStoreCreated={(newStore) => setStore(newStore)} />
            </div>
          ) : store.status === "pending" ? (
            <div className="admin-table-wrapper animate-fade" style={{ padding: "60px 40px", textAlign: "center" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px" }}>...</div>
              <h3 style={{ fontSize: "1.8rem", marginBottom: "15px" }}>Cua hang dang cho duyet</h3>
              <p style={{ color: "#64748b", maxWidth: "500px", margin: "0 auto", lineHeight: "1.6" }}>
                Yeu cau tao cua hang <strong style={{ color: "var(--text-main)" }}>"{store.name}"</strong> cua ban da duoc gui di.
                Vui long doi quan tri vien phe duyet de bat dau ban hang.
              </p>
              <button
                className="revoke-btn"
                style={{ marginTop: "30px", padding: "12px 30px" }}
                onClick={() => {
                  fetchStore();
                  refreshUserProfile?.();
                }}
              >
                Kiểm tra lại trạng thái
              </button>
            </div>
          ) : (
            <div className="animate-fade">
              <StoreDashboard
                store={store}
                token={getAuthToken()}
                onStoreUpdate={(updatedStore) => setStore(updatedStore)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default StaffPage;
