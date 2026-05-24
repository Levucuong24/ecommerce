import React, { useState, useEffect, useCallback } from "react";
import AdminHeader from "./components/AdminHeader";
import { getAuthToken } from "../../utils/authStorage";
import { DATA_EVENTS, emitDataChanged, subscribeDataChanged } from "../../utils/realtimeEvents";

const AdminPage = ({ user, onOpenLogin, onOpenCart, handleLogout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const formatPrice = (price) => {
    if (!price) return "0";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  useEffect(() => {
    if (user?.role === "admin") {
      if (activeTab === "users") fetchUsers();
      else if (activeTab === "stores") fetchStores();
      else if (activeTab === "categories") fetchCategories();
      else if (activeTab === "orders") fetchOrders();
      else fetchBanners();
    } else {
      setLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (user?.role !== "admin") return undefined;

    return subscribeDataChanged((event) => {
      if (event?.type === DATA_EVENTS.USERS && activeTab === "users") fetchUsers();
      if (event?.type === DATA_EVENTS.STORES && activeTab === "stores") fetchStores();
      if (event?.type === DATA_EVENTS.CATEGORIES && activeTab === "categories") {
        fetchCategories();
      }
    });
  }, [user, activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Không có quyền truy cập hoặc lỗi kết nối");
      }

      const data = await response.json();
      setUsers(data.items || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/stores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Không thể tải danh sách cửa hàng");
      }

      const data = await response.json();
      setStores(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/categories`);
      if (!response.ok) throw new Error("Không thể tải danh mục");
      const data = await response.json();
      setCategories(data.items || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/banners`);
      if (!response.ok) throw new Error("Không thể tải danh sách banner");
      const data = await response.json();
      setBanners(data.items || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Không thể tải danh sách đơn hàng");
      const data = await response.json();
      setOrders(data.items || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        alert("Cập nhật trạng thái đơn hàng thành công!");
        fetchOrders();
      } else {
        const err = await response.json();
        alert(err.message || "Lỗi khi cập nhật trạng thái");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi hệ thống");
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setUpdating("category");
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (!response.ok) throw new Error("Thêm danh mục thất bại");
      
      alert("Thêm danh mục thành công!");
      setNewCategoryName("");
      emitDataChanged(DATA_EVENTS.CATEGORIES);
      fetchCategories();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    setUpdating(userId);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Cập nhật thất bại");
      }

      // Update local state
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      emitDataChanged(DATA_EVENTS.USERS, { userId, role: newRole });
      alert("Cập nhật quyền thành công!");
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleUploadBanner = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUpdating("banner-upload");
    const formData = new FormData();
    formData.append("image", file);

    try {
      const token = getAuthToken();
      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Lỗi tải ảnh lên");

      const { url } = await uploadRes.json();
      const bannerRes = await fetch(`${API_URL}/banners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: url,
          order: banners.length,
          active: true
        }),
      });

      if (!bannerRes.ok) throw new Error("Lỗi lưu banner");

      alert("Thêm banner thành công!");
      fetchBanners();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa banner này?")) return;
    
    setUpdating(bannerId);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/banners/${bannerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Xóa banner thất bại");
      
      alert("Đã xóa banner!");
      fetchBanners();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateStoreStatus = async (storeId, status) => {
    setUpdating(storeId);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/stores/${storeId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Cập nhật trạng thái thất bại");
      }

      setStores(stores.map(s => s._id === storeId ? { ...s, status } : s));
      emitDataChanged(DATA_EVENTS.STORES, { storeId, status });
      alert("Cập nhật trạng thái cửa hàng thành công!");
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const completedPlatformOrders = orders.filter(o => o.orderStatus === "completed");
  const totalSales = completedPlatformOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalAdminComm = completedPlatformOrders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
  const totalMerchantRev = completedPlatformOrders.reduce((sum, o) => sum + (o.storeRevenue || 0), 0);

  const pendingPlatformOrders = orders.filter(o => o.orderStatus === "pending" || o.orderStatus === "processing");
  const totalPendingSales = pendingPlatformOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalPendingComm = pendingPlatformOrders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
  const totalPendingMerchantRev = pendingPlatformOrders.reduce((sum, o) => sum + (o.storeRevenue || 0), 0);

  return (
    <div className="admin-page-wrapper admin-page-main">
      <AdminHeader
        user={user}
        onLogout={handleLogout}
      />

      {user?.role !== "admin" ? (
        <div className="error-screen admin-container animate-fade">
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🚫</div>
          <h2>Truy cập bị từ chối</h2>
          <p>Bạn không có quyền quản trị để xem trang này.</p>
          <button className="grant-btn" onClick={() => window.location.href = "/"}>Quay lại trang chủ</button>
        </div>
      ) : (
        <main>
          <div className="admin-banner">
            <div className="admin-banner-content animate-fade">
              <h1>Hệ Thống Quản Trị</h1>
              <p>Quản lý toàn bộ hệ sinh thái người dùng, cửa hàng và danh mục</p>
            </div>
          </div>

          <div className="admin-container">
            <div className="admin-tabs animate-fade" style={{ animationDelay: "0.1s" }}>
              <button 
                className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
                onClick={() => setActiveTab("users")}
              >
                👥 Người dùng
              </button>
              <button 
                className={`tab-btn ${activeTab === "stores" ? "active" : ""}`}
                onClick={() => setActiveTab("stores")}
              >
                🏪 Yêu cầu mở Shop
              </button>
              <button 
                className={`tab-btn ${activeTab === "categories" ? "active" : ""}`}
                onClick={() => setActiveTab("categories")}
              >
                📁 Danh mục
              </button>
              <button 
                className={`tab-btn ${activeTab === "banners" ? "active" : ""}`}
                onClick={() => setActiveTab("banners")}
              >
                🖼️ Banners
              </button>
              <button 
                className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                📦 Doanh thu & Đơn hàng
              </button>
            </div>

            <div className="content-shell animate-fade" style={{ animationDelay: "0.2s" }}>
              {loading ? (
                <div className="loader-container" style={{ padding: "100px 0" }}>
                  <div className="loader"></div>
                </div>
              ) : error ? (
                <div className="admin-table-wrapper" style={{ padding: "40px", textAlign: "center" }}>
                  <p style={{ color: "#ef4444", marginBottom: "20px" }}>{error}</p>
                  <button className="grant-btn" onClick={() => window.location.reload()}>Thử lại</button>
                </div>
              ) : activeTab === "users" ? (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tên người dùng</th>
                        <th>Email</th>
                        <th>Vai trò hiện tại</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div className="user-info">
                              <div className="user-avatar-mini">
                                {u.avatar ? <img src={u.avatar} alt={u.name} /> : <span>{u.name?.[0]}</span>}
                              </div>
                              <strong>{u.name}</strong>
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`role-badge ${u.role}`}>
                              {u.role === "admin" ? "🛡️ Quản trị viên" : u.role === "staff" ? "💼 Nhân viên" : "👤 Khách hàng"}
                            </span>
                          </td>
                          <td>
                            {u.role !== "admin" && (
                              <div className="action-btns">
                                {u.role === "customer" ? (
                                  <button
                                    className="grant-btn"
                                    disabled={updating === u._id}
                                    onClick={() => handleUpdateRole(u._id, "staff")}
                                  >
                                    {updating === u._id ? "..." : "Cấp quyền Staff"}
                                  </button>
                                ) : (
                                  <button
                                    className="revoke-btn"
                                    disabled={updating === u._id}
                                    onClick={() => handleUpdateRole(u._id, "customer")}
                                  >
                                    {updating === u._id ? "..." : "Gỡ quyền Staff"}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : activeTab === "stores" ? (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tên Shop</th>
                        <th>Chủ Shop</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
                            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
                            Không có yêu cầu mở shop nào cần xử lý.
                          </td>
                        </tr>
                      ) : (
                        stores.map((s) => (
                          <tr key={s._id}>
                            <td>
                              <div className="user-info">
                                <div className="admin-shop-logo">
                                  {s.logo ? <img src={s.logo} alt={s.name} /> : <span>{s.name?.[0]}</span>}
                                </div>
                                <div>
                                  <strong>{s.name}</strong>
                                  <small style={{ color: "#64748b" }}>{s.description}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              {s.ownerId?.name}<br/>
                              <small style={{ color: "#64748b" }}>{s.ownerId?.email}</small>
                            </td>
                            <td>
                              <span className={`role-badge ${s.status}`} style={{
                                background: s.status === "active" ? "#dcfce7" : s.status === "pending" ? "#fef9c3" : "#fee2e2",
                                color: s.status === "active" ? "#16a34a" : s.status === "pending" ? "#a16207" : "#ef4444",
                              }}>
                                {s.status === "active" ? "✅ Đã duyệt" : s.status === "pending" ? "🕒 Chờ duyệt" : "🚫 Đã khóa"}
                              </span>
                            </td>
                            <td>
                              <div className="action-btns">
                                {s.status === "pending" && (
                                  <button
                                    className="grant-btn"
                                    disabled={updating === s._id}
                                    onClick={() => handleUpdateStoreStatus(s._id, "active")}
                                  >
                                    Phê duyệt
                                  </button>
                                )}
                                {s.status === "active" ? (
                                  <button
                                    className="revoke-btn"
                                    disabled={updating === s._id}
                                    onClick={() => handleUpdateStoreStatus(s._id, "inactive")}
                                  >
                                    Khóa Shop
                                  </button>
                                ) : s.status === "inactive" ? (
                                  <button
                                    className="grant-btn"
                                    disabled={updating === s._id}
                                    onClick={() => handleUpdateStoreStatus(s._id, "active")}
                                  >
                                    Mở lại
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : activeTab === "categories" ? (
                <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "20px" }}>
                  <div className="admin-table-wrapper" style={{ padding: "24px", height: "fit-content" }}>
                    <h3>Thêm danh mục mới</h3>
                    <form onSubmit={handleAddCategory} style={{ marginTop: "20px" }}>
                      <div className="form-group">
                        <label>Tên danh mục</label>
                        <input 
                          type="text" 
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Ví dụ: Áo khoác" 
                          required
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="grant-btn" 
                        style={{ width: "100%", marginTop: "15px" }}
                        disabled={updating === "category"}
                      >
                        {updating === "category" ? "Đang xử lý..." : "Lưu danh mục"}
                      </button>
                    </form>
                  </div>

                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Tên danh mục</th>
                          <th>Slug</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((c) => (
                          <tr key={c._id}>
                            <td><strong>{c.name}</strong></td>
                            <td><code>{c.slug}</code></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : activeTab === "banners" ? (
                <div className="admin-table-wrapper" style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3>Quản lý Banner Trang chủ</h3>
                    <label className="grant-btn" style={{ cursor: "pointer" }}>
                      {updating === "banner-upload" ? "Đang tải lên..." : "➕ Thêm Banner Mới"}
                      <input type="file" hidden accept="image/*" onChange={handleUploadBanner} disabled={updating === "banner-upload"} />
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                    {banners.length === 0 ? (
                      <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#64748b" }}>
                        Chưa có banner tùy chỉnh nào. Hệ thống đang sử dụng banner mặc định.
                      </div>
                    ) : (
                      banners.map((b) => (
                        <div key={b._id} className="banner-admin-card" style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", background: "#f8fafc" }}>
                          <img src={b.image} alt="Banner" style={{ width: "100%", height: "150px", objectFit: "cover" }} />
                          <div style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>Thứ tự: {b.order}</span>
                            <button 
                              className="revoke-btn" 
                              style={{ padding: "4px 10px", fontSize: "12px" }}
                              onClick={() => handleDeleteBanner(b._id)}
                              disabled={updating === b._id}
                            >
                              {updating === b._id ? "..." : "Xóa"}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* Revenue Cards Row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
                    <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "600" }}>Tổng giao dịch toàn sàn</span>
                        <span style={{ fontSize: "24px" }}>🛍️</span>
                      </div>
                      <div style={{ fontSize: "22px", fontWeight: "bold", color: "#0f172a" }}>{formatPrice(totalSales)}đ</div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "5px" }}>Doanh số thu từ đơn hàng Hoàn thành</div>
                    </div>
                    <div style={{ background: "#ecfdf5", padding: "20px", borderRadius: "8px", border: "1px solid #d1fae5" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontSize: "14px", color: "#065f46", fontWeight: "600" }}>Thu nhập Admin (5% chiết khấu)</span>
                        <span style={{ fontSize: "24px" }}>💎</span>
                      </div>
                      <div style={{ fontSize: "22px", fontWeight: "bold", color: "#059669" }}>{formatPrice(totalAdminComm)}đ</div>
                      <div style={{ fontSize: "12px", color: "#059669", marginTop: "5px" }}>Tổng hoa hồng thực thu từ hệ thống</div>
                    </div>
                    <div style={{ background: "#f0f9ff", padding: "20px", borderRadius: "8px", border: "1px solid #e0f2fe" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontSize: "14px", color: "#0369a1", fontWeight: "600" }}>Tổng thu nhập Shop (95%)</span>
                        <span style={{ fontSize: "24px" }}>🏬</span>
                      </div>
                      <div style={{ fontSize: "22px", fontWeight: "bold", color: "#0284c7" }}>{formatPrice(totalMerchantRev)}đ</div>
                      <div style={{ fontSize: "12px", color: "#0284c7", marginTop: "5px" }}>Tiền chuyển cho các chủ Shop (Staff)</div>
                    </div>
                  </div>

                  {/* Projected Revenues */}
                  <div style={{ background: "#fffbeb", padding: "20px", borderRadius: "8px", border: "1px solid #fef3c7" }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#b45309" }}>Dự kiến Doanh thu & Phí sàn (Đơn hàng đang xử lý)</h4>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "20px", fontSize: "14px" }}>
                      <div>Đơn hàng chưa giao/chờ xử lý: <strong>{pendingPlatformOrders.length} đơn</strong></div>
                      <div>Dự kiến doanh số phát sinh: <strong>{formatPrice(totalPendingSales)}đ</strong></div>
                      <div>Dự kiến phí sàn thu thêm (5%): <strong style={{ color: "#ef4444" }}>{formatPrice(totalPendingComm)}đ</strong></div>
                      <div>Dự kiến thực nhận của Shop: <strong style={{ color: "#10b981" }}>{formatPrice(totalPendingMerchantRev)}đ</strong></div>
                    </div>
                  </div>

                  {/* Orders List Table */}
                  <div className="admin-table-wrapper" style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "bold" }}>Quản lý Đơn hàng Toàn sàn</div>
                    <table className="admin-table" style={{ fontSize: "13px" }}>
                      <thead>
                        <tr>
                          <th>Mã đơn hàng</th>
                          <th>Cửa hàng (Shop)</th>
                          <th>Khách hàng</th>
                          <th>Ngày tạo</th>
                          <th>Tổng tiền</th>
                          <th>Phí sàn (5%)</th>
                          <th>Shop nhận (95%)</th>
                          <th>Trạng thái</th>
                          <th>Cập nhật trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan="9" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>Chưa có đơn hàng nào trên hệ thống.</td>
                          </tr>
                        ) : (
                          orders.map((o) => (
                            <tr key={o._id}>
                              <td><strong style={{ fontSize: "11px" }}>{o._id}</strong></td>
                              <td><strong>{o.storeId?.name || "Shop"}</strong></td>
                              <td>{o.userId?.name || "Khách"}</td>
                              <td>{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                              <td>{formatPrice(o.totalPrice)}đ</td>
                              <td style={{ color: "#ef4444" }}>{formatPrice(o.commissionAmount)}đ</td>
                              <td style={{ color: "#10b981", fontWeight: "600" }}>{formatPrice(o.storeRevenue)}đ</td>
                              <td>
                                <span style={{
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  background:
                                    o.orderStatus === "pending" ? "#fef9c3" :
                                    o.orderStatus === "processing" ? "#dbeafe" :
                                    o.orderStatus === "completed" ? "#dcfce7" : "#fee2e2",
                                  color:
                                    o.orderStatus === "pending" ? "#a16207" :
                                    o.orderStatus === "processing" ? "#1d4ed8" :
                                    o.orderStatus === "completed" ? "#15803d" : "#b91c1c",
                                }}>
                                  {o.orderStatus === "pending" ? "Chờ xử lý" :
                                   o.orderStatus === "processing" ? "Đang giao" :
                                   o.orderStatus === "completed" ? "Hoàn thành" : "Đã hủy"}
                                </span>
                              </td>
                              <td>
                                {(o.orderStatus === "pending" || o.orderStatus === "processing") && (
                                  <select
                                    value={o.orderStatus}
                                    onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value)}
                                    style={{
                                      padding: "4px 8px",
                                      borderRadius: "4px",
                                      border: "1px solid #cbd5e1",
                                      fontSize: "12px",
                                      outline: "none",
                                      cursor: "pointer"
                                    }}
                                  >
                                    <option value="pending" disabled>Chờ xử lý</option>
                                    <option value="processing">Đang giao</option>
                                    <option value="completed">Hoàn thành</option>
                                    <option value="cancelled">Hủy đơn</option>
                                  </select>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default AdminPage;
