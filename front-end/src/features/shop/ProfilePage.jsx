import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../home/components/Header";
import { getAuthToken } from "../../utils/authStorage";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function ProfilePage({ user, onLogout, onOpenLogin, onOpenCart, onUpdateUser }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    if (!user) {
      alert("Vui lòng đăng nhập để chỉnh sửa hồ sơ.");
      onOpenLogin();
      navigate("/home");
      return;
    }
    setName(user.name || "");
    setPhone(user.phone || "");
    setAvatar(user.avatar || "");
  }, [user, onOpenLogin, navigate]);

  if (!user) return null;

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (1MB)
    if (file.size > 1024 * 1024) {
      setMsg({ text: "Dung lượng ảnh tối đa là 1MB", type: "error" });
      return;
    }

    setUploading(true);
    setMsg({ text: "", type: "" });
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${apiUrl}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAvatar(data.url);
        setMsg({ text: "Tải ảnh đại diện lên thành công!", type: "success" });
      } else {
        const err = await response.json();
        setMsg({ text: err.message || "Tải ảnh lên thất bại", type: "error" });
      }
    } catch (error) {
      console.error("Lỗi khi upload ảnh:", error);
      setMsg({ text: "Lỗi kết nối khi tải ảnh", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: "", type: "" });

    try {
      const response = await fetch(`${apiUrl}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ name, phone, avatar }),
      });

      if (response.ok) {
        const data = await response.json();
        setMsg({ text: "Cập nhật hồ sơ thành công!", type: "success" });
        if (onUpdateUser) {
          onUpdateUser(data.user);
        }
      } else {
        const err = await response.json();
        setMsg({ text: err.message || "Cập nhật hồ sơ thất bại", type: "error" });
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật hồ sơ:", error);
      setMsg({ text: "Lỗi kết nối khi cập nhật hồ sơ", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page shopee-inspired" style={{ paddingTop: "180px", backgroundColor: "var(--bg-main)", minHeight: "100vh" }}>
      <Header
        user={user}
        onOpenLogin={onOpenLogin}
        onOpenCart={onOpenCart}
        onLogout={onLogout}
        onSearch={() => navigate("/home")}
      />
      <main className="content-shell following-shops-content" style={{ maxWidth: "1000px", margin: "20px auto", display: "flex", gap: "20px", padding: "0 20px" }}>
        
        {/* Sidebar */}
        <aside style={{ width: "220px", flexShrink: 0 }}>
          {/* User Brief info */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid #efefef", marginBottom: "15px" }}>
            <img 
              src={avatar || "/images/cart.png"} 
              alt="Avatar" 
              style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover", border: "1px solid #ddd" }}
            />
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontWeight: "bold", fontSize: "14px", color: "#333", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {user.name}
              </div>
              <span style={{ fontSize: "12px", color: "#888", display: "flex", alignItems: "center", gap: "3px" }}>
                ✏️ Sửa hồ sơ
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button 
              onClick={() => navigate("/profile")}
              style={{ 
                background: "none", 
                border: "none", 
                textAlign: "left", 
                padding: "8px 12px", 
                fontSize: "14px", 
                color: "var(--primary)", 
                fontWeight: "bold", 
                cursor: "pointer" 
              }}
            >
              👤 Hồ Sơ Của Tôi
            </button>
            <button 
              onClick={() => navigate("/orders/history")}
              style={{ 
                background: "none", 
                border: "none", 
                textAlign: "left", 
                padding: "8px 12px", 
                fontSize: "14px", 
                color: "#555", 
                cursor: "pointer" 
              }}
            >
              📦 Đơn Mua
            </button>
            <button 
              onClick={() => navigate("/liked-products")}
              style={{ 
                background: "none", 
                border: "none", 
                textAlign: "left", 
                padding: "8px 12px", 
                fontSize: "14px", 
                color: "#555", 
                cursor: "pointer" 
              }}
            >
              ❤️ Sản Phẩm Yêu Thích
            </button>
            <button 
              onClick={() => navigate("/following-shops")}
              style={{ 
                background: "none", 
                border: "none", 
                textAlign: "left", 
                padding: "8px 12px", 
                fontSize: "14px", 
                color: "#555", 
                cursor: "pointer" 
              }}
            >
              🏪 Shop Đang Theo Dõi
            </button>
          </div>
        </aside>

        {/* Profile Content */}
        <section style={{ flex: 1, background: "white", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "30px", border: "1px solid #f0f0f0" }}>
          <div style={{ borderBottom: "1px solid #efefef", paddingBottom: "18px", marginBottom: "30px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#333", margin: "0 0 5px 0" }}>Hồ Sơ Của Tôi</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
          </div>

          {msg.text && (
            <div style={{ 
              padding: "12px 16px", 
              borderRadius: "4px", 
              marginBottom: "20px", 
              fontSize: "14px", 
              fontWeight: "500",
              background: msg.type === "success" ? "#e6fffa" : "#fff5f5", 
              color: msg.type === "success" ? "#0d9488" : "#e11d48",
              border: msg.type === "success" ? "1px solid #99f6e4" : "1px solid #fecdd3"
            }}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "40px" }}>
            {/* Left Fields */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <label style={{ width: "120px", fontSize: "14px", color: "#555", textAlign: "right", paddingRight: "20px" }}>Tên đăng nhập</label>
                <div style={{ fontSize: "14px", color: "#333", fontWeight: "600" }}>{user.email?.split('@')[0]}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center" }}>
                <label style={{ width: "120px", fontSize: "14px", color: "#555", textAlign: "right", paddingRight: "20px" }}>Tên</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  style={{ 
                    flex: 1, 
                    padding: "10px 12px", 
                    borderRadius: "4px", 
                    border: "1px solid #ccc", 
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center" }}>
                <label style={{ width: "120px", fontSize: "14px", color: "#555", textAlign: "right", paddingRight: "20px" }}>Email</label>
                <div style={{ fontSize: "14px", color: "#333" }}>
                  {user.email} <span style={{ color: "#0d9488", marginLeft: "10px", fontSize: "12px" }}>✓ Đã xác minh</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center" }}>
                <label style={{ width: "120px", fontSize: "14px", color: "#555", textAlign: "right", paddingRight: "20px" }}>Số điện thoại</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required
                  placeholder="Nhập số điện thoại"
                  style={{ 
                    flex: 1, 
                    padding: "10px 12px", 
                    borderRadius: "4px", 
                    border: "1px solid #ccc", 
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
                <div style={{ width: "120px" }}></div>
                <button 
                  type="submit" 
                  disabled={saving || uploading}
                  className="primary-btn"
                  style={{ 
                    padding: "10px 24px", 
                    fontSize: "14px", 
                    fontWeight: "600", 
                    cursor: saving || uploading ? "not-allowed" : "pointer",
                    background: saving || uploading ? "#ccc" : "var(--primary)",
                    border: "none",
                    color: "white",
                    borderRadius: "4px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>

            {/* Right Avatar Edit */}
            <div style={{ width: "280px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderLeft: "1px solid #efefef", paddingLeft: "40px" }}>
              <img 
                src={avatar || "/images/cart.png"} 
                alt="Profile Avatar" 
                style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", marginBottom: "20px", border: "2px solid #efefef" }}
              />
              <label 
                style={{ 
                  padding: "8px 16px", 
                  border: "1px solid #ccc", 
                  borderRadius: "4px", 
                  fontSize: "14px", 
                  color: "#555", 
                  cursor: uploading ? "not-allowed" : "pointer",
                  background: uploading ? "#f5f5f5" : "#fff",
                  display: "inline-block",
                  transition: "background 0.2s"
                }}
              >
                {uploading ? "Đang tải..." : "Chọn ảnh"}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  disabled={uploading}
                  style={{ display: "none" }}
                />
              </label>
              <div style={{ marginTop: "15px", fontSize: "12px", color: "#999", textAlign: "center", lineHeight: "1.5" }}>
                Dung lượng file tối đa 1 MB<br />Định dạng: .JPEG, .PNG
              </div>
            </div>
          </form>
        </section>

      </main>
    </div>
  );
}

export default ProfilePage;
