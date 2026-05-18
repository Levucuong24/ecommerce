import { useState, useEffect } from "react";
import { createProduct } from "../services/storeApi";
import { DATA_EVENTS, emitDataChanged, subscribeDataChanged } from "../../../utils/realtimeEvents";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const fmt = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// ─── Color Variant Manager ─────────────────────────────────────────────────
function ColorVariantManager({ colors, onChange, token, basePrice }) {
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(null); // index of color being edited, null = new
  const [form, setForm] = useState({ name: "", hex: "#ee4d2d", price: "", discountPrice: "", stock: "", images: [] });

  const resetForm = () => setForm({ name: "", hex: "#ee4d2d", price: "", discountPrice: "", stock: "", images: [] });

  const openAdd = () => {
    setEditing(null);
    resetForm();
    setShowForm(true);
  };

  const openEdit = (idx) => {
    const c = colors[idx];
    setEditing(idx);
    setForm({ name: c.name, hex: c.hex, price: c.price, discountPrice: c.discountPrice || "", stock: c.stock, images: c.images || [] });
    setShowForm(true);
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch(`${API}/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error();
      return (await res.json()).url;
    } catch { alert("Không thể tải ảnh"); return null; }
    finally { setUploading(false); }
  };

  const handleImageUpload = async (e) => {
    const url = await uploadImage(e.target.files[0]);
    if (url) setForm(f => ({ ...f, images: [...f.images, url] }));
  };

  const save = () => {
    if (!form.name.trim()) return alert("Vui lòng nhập tên màu");
    if (!form.price || Number(form.price) <= 0) return alert("Vui lòng nhập giá cho màu này");
    if (form.stock === "" || Number(form.stock) < 0) return alert("Vui lòng nhập số lượng kho");
    const entry = { name: form.name, hex: form.hex, price: Number(form.price), discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined, stock: Number(form.stock), images: form.images };
    if (editing !== null) {
      onChange(colors.map((c, i) => i === editing ? entry : c));
    } else {
      onChange([...colors, entry]);
    }
    setShowForm(false);
    resetForm();
    setEditing(null);
  };

  const remove = (idx) => onChange(colors.filter((_, i) => i !== idx));

  const totalStock = colors.reduce((s, c) => s + (c.stock || 0), 0);
  const minPrice = colors.length ? Math.min(...colors.map(c => c.discountPrice || c.price)) : null;
  const maxPrice = colors.length ? Math.max(...colors.map(c => c.discountPrice || c.price)) : null;

  return (
    <div style={{ gridColumn: "span 2", marginTop: "4px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <label style={{ fontWeight: "600", fontSize: "14px" }}>
          🎨 Biến thể màu sắc
          {colors.length > 0 && (
            <span style={{ marginLeft: "8px", background: "var(--shopee-red)", color: "white", borderRadius: "12px", padding: "2px 10px", fontSize: "12px" }}>
              {colors.length} màu · Kho: {totalStock} · {minPrice === maxPrice ? `${fmt(minPrice)}₫` : `${fmt(minPrice)}₫ – ${fmt(maxPrice)}₫`}
            </span>
          )}
        </label>
        <button type="button" onClick={openAdd}
          style={{ background: "var(--shopee-red)", color: "#000000", border: "none", borderRadius: "8px", padding: "6px 14px", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}>
          + Thêm màu
        </button>
      </div>

      {/* Color Chips */}
      {colors.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          {colors.map((c, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--background-alt,#f8fafc)", border: "1px solid var(--border-color,#e2e8f0)", borderRadius: "10px", padding: "8px 12px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: c.hex, border: "2px solid rgba(0,0,0,0.15)", flexShrink: 0 }} />
              {c.images?.[0] && <img src={c.images[0]} alt={c.name} style={{ width: "28px", height: "28px", borderRadius: "4px", objectFit: "cover" }} />}
              <div>
                <div style={{ fontWeight: "600", fontSize: "13px" }}>{c.name}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {c.discountPrice ? <><s style={{ color: "#94a3b8" }}>{fmt(c.price)}₫</s> <span style={{ color: "var(--shopee-red)" }}>{fmt(c.discountPrice)}₫</span></> : <span>{fmt(c.price)}₫</span>}
                  {" · "}Kho: {c.stock}
                </div>
              </div>
              <button type="button" onClick={() => openEdit(idx)} style={{ background: "#e0f2fe", color: "#0284c7", border: "none", borderRadius: "6px", padding: "3px 8px", fontSize: "12px", cursor: "pointer" }}>✏️</button>
              <button type="button" onClick={() => remove(idx)} style={{ background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "50%", width: "20px", height: "20px", fontSize: "12px", cursor: "pointer" }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ background: "var(--background-alt,#f8fafc)", border: "1.5px dashed var(--shopee-red,#ee4d2d)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ fontWeight: "600", marginBottom: "12px", fontSize: "14px" }}>
            {editing !== null ? `✏️ Sửa màu: ${colors[editing]?.name}` : "➕ Thêm màu mới"}
          </div>

          {/* Row 1: Tên + Hex */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Tên màu *</label>
              <input type="text" placeholder="VD: Đỏ, Đen, Xanh Navy..." value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Mã màu (HEX)</label>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input type="color" value={form.hex} onChange={e => setForm(f => ({ ...f, hex: e.target.value }))}
                  style={{ width: "40px", height: "36px", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "2px", cursor: "pointer" }} />
                <input type="text" value={form.hex} onChange={e => setForm(f => ({ ...f, hex: e.target.value }))}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", fontFamily: "monospace" }} />
              </div>
            </div>
          </div>

          {/* Row 2: Giá + Giá KM + Kho */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Giá gốc (VNĐ) *</label>
              <input type="number" min="0" placeholder={basePrice || "0"} value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Giá khuyến mãi (Tùy chọn)</label>
              <input type="number" min="0" placeholder="Để trống nếu không KM" value={form.discountPrice}
                onChange={e => setForm(f => ({ ...f, discountPrice: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Số lượng kho *</label>
              <input type="number" min="0" placeholder="0" value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box" }} />
            </div>
          </div>

          {/* Ảnh màu */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>Ảnh cho màu này (Tùy chọn)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {form.images.map((url, i) => (
                <div key={i} style={{ position: "relative", width: "60px", height: "60px" }}>
                  <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }} />
                  <button type="button" onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                    style={{ position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "16px", height: "16px", fontSize: "10px", cursor: "pointer" }}>×</button>
                </div>
              ))}
              <label style={{ width: "60px", height: "60px", border: "1.5px dashed #94a3b8", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#94a3b8", fontSize: "22px" }}>
                {uploading ? "⏳" : "+"}
                <input type="file" onChange={handleImageUpload} style={{ display: "none" }} accept="image/*" />
              </label>
            </div>
          </div>

          {/* Preview + Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {form.name && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "5px 12px" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: form.hex, border: "1px solid rgba(0,0,0,0.15)" }} />
                <span style={{ fontWeight: "600" }}>{form.name}</span>
                {form.price && <span style={{ color: "var(--shopee-red)", fontWeight: "600" }}>{fmt(form.discountPrice || form.price)}₫</span>}
                {form.stock !== "" && <span style={{ color: "#94a3b8" }}>· {form.stock} cái</span>}
              </div>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); setEditing(null); }}
                style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
                Hủy
              </button>
              <button type="button" onClick={save}
                style={{ background: "var(--shopee-red,#ee4d2d)", color: "white", border: "none", borderRadius: "8px", padding: "8px 20px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>
                {editing !== null ? "✓ Cập nhật" : "✓ Thêm màu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {colors.length === 0 && !showForm && (
        <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0" }}>
          Chưa có màu nào — sản phẩm sẽ dùng giá và kho chung.
        </p>
      )}
    </div>
  );
}

// ─── Main AddProductForm ───────────────────────────────────────────────────
function AddProductForm({ token, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ name: "", description: "", price: "", discountPrice: "", stock: "", categoryId: "" });
  const [images, setImages] = useState([]);
  const [colors, setColors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const hasColors = colors.length > 0;

  useEffect(() => {
    const fetch2 = async () => {
      try {
        const r = await fetch(`${API}/categories`);
        const d = await r.json();
        setCategories(d.items || d || []);
      } catch (e) { console.error(e); }
    };
    fetch2();
    return subscribeDataChanged(ev => { if (ev?.type === DATA_EVENTS.CATEGORIES) fetch2(); });
  }, []);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch(`${API}/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setImages(prev => [...prev, data.url]);
    } catch (err) { alert("Không thể tải ảnh: " + err.message); }
    finally { setUploading(false); }
  };

  const removeImage = (i) => setImages(images.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) return setMessage("Vui lòng tải lên ít nhất một ảnh sản phẩm");
    if (hasColors && colors.some(c => !c.price || c.price <= 0)) return setMessage("Vui lòng nhập giá hợp lệ cho tất cả các màu");
    setSubmitting(true);
    setMessage("");
    try {
      const payload = {
        ...formData,
        price: hasColors ? Math.min(...colors.map(c => c.price)) : Number(formData.price),
        discountPrice: hasColors
          ? (colors.some(c => c.discountPrice) ? Math.min(...colors.filter(c => c.discountPrice).map(c => c.discountPrice)) : undefined)
          : (formData.discountPrice ? Number(formData.discountPrice) : undefined),
        stock: hasColors ? colors.reduce((s, c) => s + c.stock, 0) : Number(formData.stock),
        images,
        colors: hasColors ? colors : [],
      };
      const created = await createProduct(token, payload);
      emitDataChanged(DATA_EVENTS.PRODUCTS, { productId: created?._id });
      setMessage("Thêm sản phẩm thành công!");
      setTimeout(() => onSuccess(), 1500);
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

          {/* Tên */}
          <div className="form-group">
            <label style={{ display: "block", marginBottom: "5px" }}>Tên sản phẩm:</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Nhập tên sản phẩm" />
          </div>

          {/* Danh mục */}
          <div className="form-group">
            <label style={{ display: "block", marginBottom: "5px" }}>Danh mục:</label>
            <select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
              <option value="">Chọn danh mục</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {/* Giá gốc — ẩn nếu có màu (màu quản lý giá riêng) */}
          {!hasColors && (
            <div className="form-group">
              <label style={{ display: "block", marginBottom: "5px" }}>Giá gốc (VNĐ):</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required={!hasColors} min="0" />
            </div>
          )}

          {/* Giá KM — ẩn nếu có màu */}
          {!hasColors && (
            <div className="form-group">
              <label style={{ display: "block", marginBottom: "5px" }}>Giá khuyến mãi (Tùy chọn):</label>
              <input type="number" name="discountPrice" value={formData.discountPrice} onChange={handleChange} min="0" />
            </div>
          )}

          {/* Kho chung — ẩn nếu có màu */}
          {!hasColors && (
            <div className="form-group">
              <label style={{ display: "block", marginBottom: "5px" }}>Kho hàng:</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} required={!hasColors} min="0" />
            </div>
          )}

          {/* Thông báo khi có màu */}
          {hasColors && (
            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#166534" }}>
                ✅ Giá và kho hàng được quản lý riêng cho từng màu bên dưới.
                Giá hiển thị sản phẩm sẽ = <strong>giá thấp nhất</strong> trong các màu ({Math.min(...colors.map(c => c.discountPrice || c.price)).toLocaleString("vi-VN")}₫).
              </div>
            </div>
          )}

          {/* Ảnh chính */}
          <div className="form-group" style={{ gridColumn: "span 2" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>Hình ảnh sản phẩm chính:</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
              {images.map((url, i) => (
                <div key={i} style={{ position: "relative", width: "100px", height: "100px" }}>
                  <img src={url} alt="Product" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                  <button type="button" onClick={() => removeImage(i)}
                    style={{ position: "absolute", top: "-5px", right: "-5px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", fontSize: "12px", cursor: "pointer" }}>×</button>
                </div>
              ))}
              <label style={{ width: "100px", height: "100px", border: "2px dashed var(--border)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexDirection: "column", fontSize: "24px", color: "var(--text-muted)" }}>
                {uploading ? "⏳" : "+"}
                <input type="file" onChange={handleFileChange} style={{ display: "none" }} accept="image/*" />
              </label>
            </div>
            <small style={{ color: "var(--text-muted)" }}>Hỗ trợ JPG, PNG. Tối đa 5MB.</small>
          </div>

          {/* Color Variant Manager */}
          <ColorVariantManager colors={colors} onChange={setColors} token={token} basePrice={formData.price} />
        </div>

        {/* Mô tả */}
        <div className="form-group" style={{ marginTop: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Mô tả sản phẩm:</label>
          <textarea name="description" value={formData.description} onChange={handleChange}
            style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ddd", minHeight: "100px" }} />
        </div>

        {message && (
          <p style={{ color: message.includes("thành công") ? "green" : "var(--shopee-red)", marginTop: "15px" }}>{message}</p>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button type="submit" className="grant-btn" disabled={submitting} style={{ flex: 1 }}>
            {submitting ? "Đang xử lý..." : "Lưu sản phẩm"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProductForm;
