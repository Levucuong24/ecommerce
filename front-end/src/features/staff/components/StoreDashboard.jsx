import { useState } from "react";
import AddProductForm from "./AddProductForm";

function StoreDashboard({ store, token, onStoreUpdate }) {
  const [showAddProduct, setShowAddProduct] = useState(false);

  return (
    <div className="store-dashboard">
      <div className="admin-table-wrapper" style={{ padding: "24px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3>{store.name}</h3>
            <p style={{ color: "#666" }}>{store.description}</p>
          </div>
          {store.logo && (
            <img 
              src={store.logo} 
              alt="Store Logo" 
              style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }} 
            />
          )}
        </div>
        <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
          <button 
            className="grant-btn" 
            style={{ background: "white", color: "var(--shopee-red)", border: "1px solid var(--shopee-red)" }}
            onClick={() => {/* Implement Edit Store */}}
          >
            Chỉnh sửa thông tin
          </button>
          <button 
            className="grant-btn"
            onClick={() => setShowAddProduct(!showAddProduct)}
          >
            {showAddProduct ? "Hủy" : "Thêm sản phẩm mới"}
          </button>
        </div>
      </div>

      {showAddProduct && (
        <AddProductForm 
          token={token} 
          onSuccess={() => {
            setShowAddProduct(false);
            // Optionally refresh product list
          }} 
        />
      )}

      {!showAddProduct && (
        <div className="admin-table-wrapper" style={{ padding: "24px" }}>
          <h4>Sản phẩm của tôi</h4>
          <p style={{ color: "#666", marginTop: "10px" }}>Danh sách sản phẩm của bạn sẽ hiển thị ở đây.</p>
          {/* Implement product list here */}
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p>Chưa có sản phẩm nào được hiển thị chi tiết ở bản cập nhật này.</p>
            <button 
              className="grant-btn" 
              style={{ marginTop: "10px" }}
              onClick={() => setShowAddProduct(true)}
            >
              Bắt đầu thêm sản phẩm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoreDashboard;
