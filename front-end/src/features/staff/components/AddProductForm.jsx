import { useState, useEffect } from "react";
import { createProduct } from "../services/storeApi";

function AddProductForm({ token, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    stock: "",
    categoryId: "",
  });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/categories`);
        const data = await response.json();
        setCategories(data.items || data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

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
      setImages([...images, data.url]);
    } catch (err) {
      alert("Không thể tải ảnh lên: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      setMessage("Vui lòng tải lên ít nhất một ảnh sản phẩm");
      return;
    }
    setSubmitting(true);
    setMessage("");

    try {
      const productData = {
        ...formData,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        stock: Number(formData.stock),
        images: images,
      };
      
      await createProduct(token, productData);
      setMessage("Thêm sản phẩm thành công!");
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setMessage(err.message || "Không thể thêm sản phẩm");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-table-wrapper" style={{ padding: "24px", marginBottom: "20px" }}>
      <h4>Thêm sản phẩm mới</h4>
      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div className="form-group">
            <label style={{ display: "block", marginBottom: "5px" }}>Tên sản phẩm:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Nhập tên sản phẩm"
            />
          </div>
          <div className="form-group">
            <label style={{ display: "block", marginBottom: "5px" }}>Danh mục:</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
            >
              <option value="">Chọn danh mục</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label style={{ display: "block", marginBottom: "5px" }}>Giá gốc (VNĐ):</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label style={{ display: "block", marginBottom: "5px" }}>Giá khuyến mãi (Tùy chọn):</label>
            <input
              type="number"
              name="discountPrice"
              value={formData.discountPrice}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label style={{ display: "block", marginBottom: "5px" }}>Kho hàng:</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group" style={{ gridColumn: "span 2" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>Hình ảnh sản phẩm:</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
              {images.map((url, index) => (
                <div key={index} style={{ position: "relative", width: "100px", height: "100px" }}>
                  <img src={url} alt="Product" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                  <button 
                    type="button" 
                    onClick={() => removeImage(index)}
                    style={{ 
                      position: "absolute", top: "-5px", right: "-5px", 
                      background: "#ef4444", color: "white", border: "none", 
                      borderRadius: "50%", width: "20px", height: "20px", 
                      fontSize: "12px", cursor: "pointer" 
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <label style={{ 
                width: "100px", height: "100px", border: "2px dashed var(--border)", 
                borderRadius: "8px", display: "flex", alignItems: "center", 
                justifyContent: "center", cursor: "pointer", flexDirection: "column",
                fontSize: "24px", color: "var(--text-muted)"
              }}>
                {uploading ? "⏳" : "+"}
                <input type="file" onChange={handleFileChange} style={{ display: "none" }} accept="image/*" />
              </label>
            </div>
            <small style={{ color: "var(--text-muted)" }}>Hỗ trợ JPG, PNG. Tối đa 5MB.</small>
          </div>
        </div>
        
        <div className="form-group" style={{ marginTop: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Mô tả sản phẩm:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ddd", minHeight: "100px" }}
          />
        </div>

        {message && (
          <p style={{ 
            color: message.includes("thành công") ? "green" : "var(--shopee-red)", 
            marginTop: "15px" 
          }}>
            {message}
          </p>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button 
            type="submit" 
            className="grant-btn" 
            disabled={submitting}
            style={{ flex: 1 }}
          >
            {submitting ? "Đang xử lý..." : "Lưu sản phẩm"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProductForm;
