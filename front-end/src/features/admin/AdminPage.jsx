import React, { useState, useEffect } from "react";
import Header from "../home/components/Header";
import AdminHeader from "./components/AdminHeader";

const AdminPage = ({ user, onOpenLogin, onOpenCart, handleLogout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
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
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    setUpdating(userId);
    try {
      const token = localStorage.getItem("token");
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
      alert("Cập nhật quyền thành công!");
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="admin-page-wrapper home-page shopee-inspired">
      <AdminHeader
        user={user}
        onLogout={handleLogout}
      />

      {user?.role !== "admin" ? (
        <div className="error-screen admin-container">
          <h2>Truy cập bị từ chối</h2>
          <p>Bạn không có quyền quản trị để xem trang này.</p>
          <button className="grant-btn" onClick={() => window.location.href = "/"}>Quay lại trang chủ</button>
        </div>
      ) : (
        <main className="admin-page-main">
          <div className="admin-banner">
            <div className="admin-banner-content">
              <h1>Hệ Thống Quản Trị</h1>
              <p>Quản lý người dùng, phân quyền và giám sát hoạt động hệ thống</p>
            </div>
          </div>

          <div className="content-shell admin-container">
            {loading ? (
              <div className="loader-container">
                <div className="loader"></div>
              </div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
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
                            {u.name}
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`role-badge ${u.role}`}>
                            {u.role === "admin" ? "Quản trị viên" : u.role === "staff" ? "Nhân viên" : "Khách hàng"}
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
                                  {updating === u._id ? "Đang xử lý..." : "Cấp quyền Staff"}
                                </button>
                              ) : (
                                <button
                                  className="revoke-btn"
                                  disabled={updating === u._id}
                                  onClick={() => handleUpdateRole(u._id, "customer")}
                                >
                                  {updating === u._id ? "Đang xử lý..." : "Gỡ quyền Staff"}
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
            )}
          </div>
        </main>
      )}
    </div>
  );
};

export default AdminPage;
