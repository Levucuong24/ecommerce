import { useState } from "react";
import { createStore } from "../services/storeApi";
import { DATA_EVENTS, emitDataChanged } from "../../../utils/realtimeEvents";

function StoreSetup({ token, onStoreCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [logo, setLogo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append("image", file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) throw new Error("Upload failed");
      
      const data = await response.json();
      setLogo(data.url);
    } catch (err) {
      alert("Không thể tải ảnh lên: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const newStore = await createStore(token, { ...formData, logo });
      emitDataChanged(DATA_EVENTS.STORES, { storeId: newStore?._id });
      onStoreCreated(newStore);
    } catch (err) {
      setMessage(err.message || "Không thể tạo cửa hàng");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-table-wrapper" style={{ padding: "24px" }}>
      <h3>Thiết lập cửa hàng của bạn</h3>
      <p>Bạn chưa có cửa hàng. Hãy điền thông tin bên dưới để bắt đầu bán hàng.</p>
      
      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        <div className="form-group" style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Tên cửa hàng:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ví dụ: GALAXY Official Store"
          />
        </div>
        <div className="form-group" style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Mô tả:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mô tả ngắn về cửa hàng của bạn..."
            style={{ minHeight: "100px" }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Logo cửa hàng:</label>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ 
              width: "80px", height: "80px", borderRadius: "50%", 
              background: "#f1f5f9", display: "flex", alignItems: "center", 
              justifyContent: "center", overflow: "hidden", border: "1px solid var(--border)"
            }}>
              {logo ? <img src={logo} alt="Logo Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>Logo</span>}
            </div>
            <label className="revoke-btn" style={{ cursor: "pointer", padding: "8px 16px" }}>
              {uploading ? "Đang tải..." : "Chọn ảnh từ máy tính"}
              <input type="file" onChange={handleFileChange} style={{ display: "none" }} accept="image/*" />
            </label>
          </div>
        </div>

        {message && <p style={{ color: "var(--shopee-red)", marginBottom: "15px" }}>{message}</p>}

        <button 
          type="submit" 
          className="grant-btn" 
          disabled={submitting}
          style={{ width: "100%", padding: "12px" }}
        >
          {submitting ? "Đang tạo..." : "Tạo cửa hàng ngay"}
        </button>
      </form>
    </div>
  );
}

export default StoreSetup;
