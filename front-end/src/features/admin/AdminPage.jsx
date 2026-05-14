import React, { useState, useEffect } from "react";
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
  const [newCategoryName, setNewCategoryName] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (user?.role === "admin") {
      if (activeTab === "users") fetchUsers();
      else if (activeTab === "stores") fetchStores();
      else fetchCategories();
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
                                <div className="user-avatar-mini">
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
              ) : (
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
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default AdminPage;
