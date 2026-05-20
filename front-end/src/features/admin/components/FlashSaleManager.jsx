import React, { useState, useEffect } from "react";
import { getAuthToken } from "../../../utils/authStorage";

const FlashSaleManager = ({ apiUrl }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [flashSaleData, setFlashSaleData] = useState({
    enable: false,
    startTime: "",
    endTime: "",
    flashSaleDiscountPercent: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/products?limit=100`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data.items) ? data.items : []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlashSaleClick = (product) => {
    setSelectedProduct(product);
    setFlashSaleData({
      enable: product.isFlashSale || false,
      startTime: product.flashSaleStartTime?.substring(0, 16) || "",
      endTime: product.flashSaleEndTime?.substring(0, 16) || "",
      flashSaleDiscountPercent: product.flashSaleDiscountPercent || 0,
    });
    setShowModal(true);
  };

  const handleFlashSaleSave = async () => {
    if (!selectedProduct) return;
    try {
      const response = await fetch(
        `${apiUrl}/products/${selectedProduct._id}/flash-sale`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(flashSaleData),
        }
      );
      if (response.ok) {
        alert("Flash Sale updated successfully!");
        setShowModal(false);
        fetchProducts();
      } else {
        alert("Failed to update Flash Sale");
      }
    } catch (error) {
      console.error("Error updating Flash Sale:", error);
      alert("Error updating Flash Sale");
    }
  };

  return (
    <>
      {loading ? (
        <div style={{ padding: "100px 0", textAlign: "center" }}>
          <div className="loader"></div>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên sản phẩm</th>
                <th>Giá</th>
                <th>Trạng thái Flash Sale</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "40px" }}>
                    Không có sản phẩm nào
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.price?.toLocaleString()} VND</td>
                    <td>
                      <span
                        style={{
                          background: p.isFlashSale ? "#dcfce7" : "#fee2e2",
                          color: p.isFlashSale ? "#16a34a" : "#ef4444",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        {p.isFlashSale ? "🔥 Đang giảm" : "❌ Không"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="grant-btn"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                        onClick={() => handleFlashSaleClick(p)}
                      >
                        Cập nhật
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "400px",
              width: "90%",
            }}
          >
            <h3>Quản lý Flash Sale: {selectedProduct?.name}</h3>
            <div style={{ marginTop: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                <input
                  type="checkbox"
                  checked={flashSaleData.enable}
                  onChange={(e) =>
                    setFlashSaleData({ ...flashSaleData, enable: e.target.checked })
                  }
                />
                Bật Flash Sale
              </label>
              {flashSaleData.enable && (
                <>
                  <div style={{ marginBottom: "15px" }}>
                    <label>Phần trăm giảm giá (%):</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={flashSaleData.flashSaleDiscountPercent || ""}
                      onChange={(e) =>
                        setFlashSaleData({ ...flashSaleData, flashSaleDiscountPercent: Number(e.target.value) })
                      }
                      placeholder="Nhập % giảm giá"
                      style={{
                        width: "100%",
                        padding: "8px",
                        marginTop: "5px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                      }}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label>Thời gian bắt đầu:</label>
                    <input
                      type="datetime-local"
                      value={flashSaleData.startTime}
                      onChange={(e) =>
                        setFlashSaleData({ ...flashSaleData, startTime: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        marginTop: "5px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label>Thời gian kết thúc:</label>
                    <input
                      type="datetime-local"
                      value={flashSaleData.endTime}
                      onChange={(e) =>
                        setFlashSaleData({ ...flashSaleData, endTime: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        marginTop: "5px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>
                </>
              )}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  className="revoke-btn"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "8px 16px" }}
                >
                  Hủy
                </button>
                <button
                  className="grant-btn"
                  onClick={handleFlashSaleSave}
                  style={{ padding: "8px 16px" }}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FlashSaleManager;