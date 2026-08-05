import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";
import { getAuthToken } from "../../utils/authStorage";
import { formatPrice } from "../home/utils";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function WarehousePage({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inventory"); // "inventory" | "receipts" | "orders"
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all"); // "all" | "low" | "out"
  const [receiptSearch, setReceiptSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "pending_approval" | "approved" | "rejected"

  // Quick Stock Adjustment Inputs
  const [stockInputs, setStockInputs] = useState({});

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [receiptForm, setReceiptForm] = useState({
    quantity: 10,
    importPrice: 0,
    supplier: "Nhà cung cấp chính",
    note: "Nhập thêm hàng định kỳ",
    proofImage: ""
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch products
      const resProducts = await fetch(`${apiUrl}/products?limit=1000`, { headers });
      if (resProducts.ok) {
        const prodData = await resProducts.json();
        const items = prodData.items || (Array.isArray(prodData) ? prodData : []);
        setProducts(items);
        
        const initialMap = {};
        items.forEach(p => {
          initialMap[p.id || p._id] = p.stock ?? 0;
        });
        setStockInputs(initialMap);
      }

      // Fetch orders
      const resOrders = await fetch(`${apiUrl}/orders`, { headers });
      if (resOrders.ok) {
        const orderData = await resOrders.json();
        setOrders(orderData.items || (Array.isArray(orderData) ? orderData : []));
      } else {
        const resStoreOrders = await fetch(`${apiUrl}/orders/store`, { headers });
        if (resStoreOrders.ok) {
          const storeOrderData = await resStoreOrders.json();
          setOrders(storeOrderData.items || (Array.isArray(storeOrderData) ? storeOrderData : []));
        }
      }

      // Fetch Inventory Receipts History
      const resReceipts = await fetch(`${apiUrl}/inventory/receipts`, { headers });
      if (resReceipts.ok) {
        const receiptData = await resReceipts.json();
        setReceipts(Array.isArray(receiptData) ? receiptData : []);
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu kho:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdjustStockInput = (productId, delta) => {
    setStockInputs(prev => {
      const current = parseInt(prev[productId] || 0, 10);
      return { ...prev, [productId]: Math.max(0, current + delta) };
    });
  };

  // Open Create Receipt Modal
  const openCreateReceiptModal = (product) => {
    setSelectedProduct(product);
    setReceiptForm({
      quantity: 10,
      importPrice: product.price || 0,
      supplier: "Công ty phân phối chính",
      note: `Nhập đợt mới cho ${product.name}`,
      proofImage: product.image || product.images?.[0] || ""
    });
    setShowReceiptModal(true);
  };

  // Submit Inventory Receipt Request to Admin
  const handleCreateReceiptSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = parseInt(receiptForm.quantity, 10);
    const price = parseFloat(receiptForm.importPrice);

    if (isNaN(qty) || qty <= 0) {
      showToast("❌ Số lượng nhập phải lớn hơn 0");
      return;
    }

    try {
      const token = getAuthToken();
      const pId = selectedProduct.id || selectedProduct._id;
      const res = await fetch(`${apiUrl}/inventory/receipts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: pId,
          quantity: qty,
          importPrice: price,
          supplier: receiptForm.supplier,
          note: receiptForm.note,
          proofImage: receiptForm.proofImage
        })
      });

      if (res.ok) {
        const result = await res.json();
        showToast("⏳ Đã gửi yêu cầu nhập kho lên Admin duyệt thành công!");
        
        // Add new receipt to receipts state
        if (result.receipt) {
          setReceipts(prev => [result.receipt, ...prev]);
        }

        setShowReceiptModal(false);
      } else {
        const err = await res.json();
        showToast(`❌ Lỗi: ${err.message || "Gửi yêu cầu thất bại"}`);
      }
    } catch (err) {
      console.error("Lỗi khi tạo biên lai nhập kho:", err);
      showToast("❌ Lỗi kết nối máy chủ!");
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiUrl}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        showToast(`✅ Đã cập nhật đơn hàng thành: ${newStatus}`);
        setOrders(prev => prev.map(o => (o._id === orderId || o.id === orderId) ? { ...o, orderStatus: newStatus } : o));
      } else {
        const err = await res.json();
        showToast(`❌ Lỗi: ${err.message || "Cập nhật thất bại"}`);
      }
    } catch (err) {
      console.error("Lỗi cập nhật đơn hàng:", err);
      showToast("❌ Lỗi kết nối!");
    }
  };

  // Computed KPI metrics
  const totalStockCount = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const lowStockCount = products.filter(p => (p.stock || 0) < 10).length;
  const pendingOrders = orders.filter(o => o.orderStatus === "pending" || o.orderStatus === "processing");
  const pendingReceipts = receipts.filter(r => r.status === "pending_approval");
  const approvedReceipts = receipts.filter(r => r.status === "approved");

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.categoryName?.toLowerCase().includes(searchQuery.toLowerCase());
    const stock = Number(p.stock) || 0;
    if (stockFilter === "low") return matchesSearch && stock > 0 && stock < 10;
    if (stockFilter === "out") return matchesSearch && stock === 0;
    return matchesSearch;
  });

  // Filtered Receipts
  const filteredReceipts = receipts.filter(r => {
    const q = receiptSearch.toLowerCase();
    const matchesSearch = r.receiptCode?.toLowerCase().includes(q) ||
                          r.productName?.toLowerCase().includes(q) ||
                          r.supplier?.toLowerCase().includes(q);
    if (statusFilter !== "all") {
      return matchesSearch && r.status === statusFilter;
    }
    return matchesSearch;
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Outfit', sans-serif" }}>
      {/* Header Bar */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid #e2e8f0",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Logo />
          <div style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "#fff",
            fontWeight: "800",
            fontSize: "0.8rem",
            padding: "4px 12px",
            borderRadius: "99px",
            letterSpacing: "0.05em"
          }}>
            QUẢN LÝ KHO & YÊU CẦU NHẬP
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              background: "#fff",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.85rem"
            }}
          >
            🏠 Về trang chủ
          </button>
          <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#334155" }}>
            👤 {user?.name || "Quản lý kho"}
          </div>
          <button
            onClick={onLogout}
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.85rem"
            }}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1400px", margin: "32px auto", padding: "0 24px" }}>
        
        {/* Toast alert */}
        {toastMessage && (
          <div style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            zIndex: 1000,
            background: "#0f172a",
            color: "#fff",
            padding: "14px 24px",
            borderRadius: "14px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            fontWeight: "600",
            fontSize: "0.95rem",
            animation: "fadeIn 0.3s ease"
          }}>
            {toastMessage}
          </div>
        )}

        {/* KPI Dashboard */}
        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "32px"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(15,23,42,0.04)"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
              📦 TỔNG TỒN KHO HIỆN TẠI
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#475569", marginTop: "8px" }}>
              {totalStockCount.toLocaleString("vi-VN")} <span style={{ fontSize: "1rem", color: "#94a3b8" }}>sản phẩm</span>
            </div>
          </div>

          <div style={{
            background: lowStockCount > 0 ? "linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)" : "#fff",
            borderRadius: "20px",
            padding: "24px",
            border: lowStockCount > 0 ? "1px solid #fca5a5" : "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(15,23,42,0.04)"
          }}>
            <div style={{ fontSize: "0.85rem", color: lowStockCount > 0 ? "#dc2626" : "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
              ⚠️ CẢNH BÁO SẮP HẾT HÀNG
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: "800", color: lowStockCount > 0 ? "#ef4444" : "#1e293b", marginTop: "8px" }}>
              {lowStockCount} <span style={{ fontSize: "1rem", color: "#94a3b8" }}>mặt hàng</span>
            </div>
          </div>

          <div style={{
            background: pendingReceipts.length > 0 ? "linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)" : "#fff",
            borderRadius: "20px",
            padding: "24px",
            border: pendingReceipts.length > 0 ? "1px solid #fcd34d" : "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(15,23,42,0.04)"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#d97706", fontWeight: "600", textTransform: "uppercase" }}>
              ⏳ PHIẾU CHỜ ADMIN DUYỆT
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#d97706", marginTop: "8px" }}>
              {pendingReceipts.length} <span style={{ fontSize: "1rem", color: "#94a3b8" }}>yêu cầu</span>
            </div>
          </div>

          <div style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(15,23,42,0.04)"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: "600", textTransform: "uppercase" }}>
              ✅ ĐÃ DUYỆT & NHẬP KHO
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#10b981", marginTop: "8px" }}>
              {approvedReceipts.length} <span style={{ fontSize: "1rem", color: "#94a3b8" }}>đợt nhập</span>
            </div>
          </div>
        </section>

        {/* Tab Switcher */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "12px",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => setActiveTab("inventory")}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              background: activeTab === "inventory" ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" : "transparent",
              color: activeTab === "inventory" ? "#fff" : "#64748b",
              fontWeight: "700",
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            📋 Danh Sách Sản Phẩm Trong Kho ({products.length})
          </button>

          <button
            onClick={() => setActiveTab("receipts")}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              background: activeTab === "receipts" ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" : "transparent",
              color: activeTab === "receipts" ? "#fff" : "#64748b",
              fontWeight: "700",
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            🧾 Yêu Cầu & Biên Lai Nhập Kho ({receipts.length})
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              background: activeTab === "orders" ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" : "transparent",
              color: activeTab === "orders" ? "#fff" : "#64748b",
              fontWeight: "700",
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            🚚 Xuất Kho Đơn Hàng ({pendingOrders.length} chờ)
          </button>
        </div>

        {/* TAB 1: INVENTORY MANAGEMENT */}
        {activeTab === "inventory" && (
          <div style={{ background: "#fff", borderRadius: "24px", padding: "28px", border: "1px solid #e2e8f0" }}>
            {/* Search & Filter Toolbar */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="🔍 Tìm kiếm sản phẩm theo tên hoặc danh mục..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: "280px",
                  padding: "12px 18px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.95rem",
                  outline: "none"
                }}
              />

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setStockFilter("all")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    background: stockFilter === "all" ? "#1e293b" : "#fff",
                    color: stockFilter === "all" ? "#fff" : "#475569",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Tất cả ({products.length})
                </button>
                <button
                  onClick={() => setStockFilter("low")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    background: stockFilter === "low" ? "#ef4444" : "#fff",
                    color: stockFilter === "low" ? "#fff" : "#475569",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  ⚠️ Sắp hết (&lt;10)
                </button>
                <button
                  onClick={() => setStockFilter("out")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    background: stockFilter === "out" ? "#991b1b" : "#fff",
                    color: stockFilter === "out" ? "#fff" : "#475569",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  ❌ Hết hàng (0)
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            {loading ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Đang tải dữ liệu kho...</div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>Không tìm thấy sản phẩm phù hợp.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase" }}>
                      <th style={{ padding: "12px" }}>Sản Phẩm</th>
                      <th style={{ padding: "12px" }}>Giá Bán</th>
                      <th style={{ padding: "12px" }}>Tồn Kho Thực Tế</th>
                      <th style={{ padding: "12px" }}>Thao Tác Nhập Hàng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => {
                      const pId = product.id || product._id;
                      const currentStock = Number(product.stock) || 0;
                      const isLow = currentStock < 10;
                      const isOut = currentStock === 0;

                      return (
                        <tr key={pId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "16px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <img
                                src={product.image || product.images?.[0] || "https://via.placeholder.com/60"}
                                alt={product.name}
                                style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "10px", border: "1px solid #e2e8f0" }}
                              />
                              <div>
                                <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#1e293b" }}>{product.name}</div>
                                <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Mã: {pId.slice(-6)}</div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: "16px 12px", fontWeight: "700", color: "#0f172a" }}>
                            {formatPrice(product.price)}đ
                          </td>

                          <td style={{ padding: "16px 12px" }}>
                            <span style={{
                              padding: "6px 14px",
                              borderRadius: "99px",
                              fontWeight: "800",
                              fontSize: "0.9rem",
                              background: isOut ? "#fee2e2" : isLow ? "#fef3c7" : "#ecfdf5",
                              color: isOut ? "#991b1b" : isLow ? "#d97706" : "#047857"
                            }}>
                              {currentStock} SP {isOut ? "(Hết hàng)" : isLow ? "(Sắp hết)" : ""}
                            </span>
                          </td>

                          <td style={{ padding: "16px 12px" }}>
                            <button
                              onClick={() => openCreateReceiptModal(product)}
                              style={{
                                padding: "9px 18px",
                                borderRadius: "10px",
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                color: "#fff",
                                border: "none",
                                fontWeight: "700",
                                cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(16,185,129,0.25)",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                              }}
                            >
                              <span>➕ Gửi Yêu Cầu Nhập Kho (Kèm Ảnh)</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RECEIPT HISTORY */}
        {activeTab === "receipts" && (
          <div style={{ background: "#fff", borderRadius: "24px", padding: "28px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#1e293b" }}>Nhật Ký & Trạng Thái Phiếu Nhập Kho</h3>
              
              <div style={{ display: "flex", gap: "12px" }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    fontWeight: "600"
                  }}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending_approval">⏳ Chờ Admin Duyệt</option>
                  <option value="approved">✅ Đã Duyệt & Nhập Kho</option>
                  <option value="rejected">❌ Từ Chối</option>
                </select>

                <input
                  type="text"
                  placeholder="🔍 Tìm theo Mã biên lai, Tên SP, Nhà cung cấp..."
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    width: "280px"
                  }}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Đang tải lịch sử biên lai...</div>
            ) : filteredReceipts.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>Chưa có yêu cầu nhập kho nào. Bấm "Gửi Yêu Cầu Nhập Kho" để tạo mới!</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase" }}>
                      <th style={{ padding: "12px" }}>Mã Phiếu</th>
                      <th style={{ padding: "12px" }}>Trạng Thái Duyệt</th>
                      <th style={{ padding: "12px" }}>Ảnh Chứng Từ</th>
                      <th style={{ padding: "12px" }}>Sản Phẩm Nhập</th>
                      <th style={{ padding: "12px" }}>Số Lượng</th>
                      <th style={{ padding: "12px" }}>Đơn Giá</th>
                      <th style={{ padding: "12px" }}>Tổng Giá Trị</th>
                      <th style={{ padding: "12px" }}>Nhà Cung Cấp</th>
                      <th style={{ padding: "12px" }}>Người Gửi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.map(rec => {
                      const isPending = rec.status === "pending_approval";
                      const isApproved = rec.status === "approved";
                      const isRejected = rec.status === "rejected";

                      return (
                        <tr key={rec._id || rec.receiptCode} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "16px 12px" }}>
                            <span style={{
                              padding: "4px 10px",
                              borderRadius: "8px",
                              background: "#e0e7ff",
                              color: "#3730a3",
                              fontWeight: "800",
                              fontSize: "0.85rem"
                            }}>
                              {rec.receiptCode}
                            </span>
                            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>
                              {new Date(rec.createdAt).toLocaleString("vi-VN")}
                            </div>
                          </td>

                          <td style={{ padding: "16px 12px" }}>
                            <span style={{
                              padding: "6px 12px",
                              borderRadius: "99px",
                              fontWeight: "800",
                              fontSize: "0.8rem",
                              background: isPending ? "#fef3c7" : isApproved ? "#dcfce7" : "#fee2e2",
                              color: isPending ? "#d97706" : isApproved ? "#15803d" : "#b91c1c"
                            }}>
                              {isPending ? "⏳ Chờ Admin Duyệt" : isApproved ? "✅ Đã Duyệt & Nhập Kho" : "❌ Từ Chối"}
                            </span>
                          </td>

                          <td style={{ padding: "16px 12px" }}>
                            {rec.proofImage ? (
                              <img
                                src={rec.proofImage}
                                alt="Chứng từ"
                                onClick={() => setPreviewImage(rec.proofImage)}
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                  border: "1px solid #cbd5e1",
                                  cursor: "pointer"
                                }}
                                title="Bấm để xem ảnh phóng to"
                              />
                            ) : (
                              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Không có</span>
                            )}
                          </td>

                          <td style={{ padding: "16px 12px", fontWeight: "700", color: "#1e293b" }}>
                            {rec.productName}
                          </td>

                          <td style={{ padding: "16px 12px" }}>
                            <span style={{ fontWeight: "800", color: "#059669", fontSize: "0.95rem" }}>
                              +{rec.quantity} SP
                            </span>
                          </td>

                          <td style={{ padding: "16px 12px", fontWeight: "600", color: "#475569" }}>
                            {formatPrice(rec.importPrice)}đ
                          </td>

                          <td style={{ padding: "16px 12px", fontWeight: "800", color: "#2563eb" }}>
                            {formatPrice(rec.totalPrice)}đ
                          </td>

                          <td style={{ padding: "16px 12px", fontSize: "0.85rem", color: "#475569" }}>
                            {rec.supplier || "N/A"}
                            {rec.note && <div style={{ fontSize: "0.78rem", color: "#94a3b8", fontStyle: "italic" }}>"{rec.note}"</div>}
                          </td>

                          <td style={{ padding: "16px 12px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>
                            👤 {rec.createdByName || "Quản lý kho"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DISPATCH ORDERS */}
        {activeTab === "orders" && (
          <div style={{ background: "#fff", borderRadius: "24px", padding: "28px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: "1.2rem", color: "#1e293b" }}>Danh Sách Đơn Hàng Cần Đóng Gói & Xuất Kho</h3>
            {loading ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Đang tải danh sách đơn hàng...</div>
            ) : orders.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>Chưa có đơn hàng nào cần xuất kho.</div>
            ) : (
              <div style={{ display: "grid", gap: "20px" }}>
                {orders.map(order => {
                  const oId = order._id || order.id;
                  const isPending = order.orderStatus === "pending" || order.orderStatus === "processing";
                  const isShipping = order.orderStatus === "shipping";

                  return (
                    <div key={oId} style={{
                      padding: "20px",
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "20px",
                      flexWrap: "wrap"
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                          <strong style={{ fontSize: "1rem", color: "#0f172a" }}>Đơn hàng #{oId.slice(-8)}</strong>
                          <span style={{
                            padding: "4px 10px",
                            borderRadius: "99px",
                            fontSize: "0.75rem",
                            fontWeight: "800",
                            background: isPending ? "#fef3c7" : isShipping ? "#dbeafe" : "#dcfce7",
                            color: isPending ? "#d97706" : isShipping ? "#2563eb" : "#15803d"
                          }}>
                            {order.orderStatus?.toUpperCase() || "PENDING"}
                          </span>
                        </div>

                        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                          👤 Người nhận: <strong>{order.shippingAddress?.fullName || order.fullName || "Khách hàng"}</strong> ({order.shippingAddress?.phone || "SĐT"})
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "2px" }}>
                          📍 Địa chỉ: {order.shippingAddress?.detail || "Địa chỉ giao hàng"}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: "700", marginTop: "6px" }}>
                          Tổng giá trị: {formatPrice(order.totalAmount || order.totalPrice || 0)}đ
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        {isPending && (
                          <button
                            onClick={() => handleUpdateOrderStatus(oId, "shipping")}
                            style={{
                              padding: "10px 20px",
                              borderRadius: "12px",
                              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              color: "#fff",
                              border: "none",
                              fontWeight: "700",
                              cursor: "pointer",
                              boxShadow: "0 4px 12px rgba(16,185,129,0.3)"
                            }}
                          >
                            📦 Xác Nhận Xuất Kho & Đang Giao
                          </button>
                        )}
                        {isShipping && (
                          <button
                            onClick={() => handleUpdateOrderStatus(oId, "delivered")}
                            style={{
                              padding: "10px 20px",
                              borderRadius: "12px",
                              background: "#2563eb",
                              color: "#fff",
                              border: "none",
                              fontWeight: "700",
                              cursor: "pointer"
                            }}
                          >
                            ✅ Đã Giao Thành Công
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* CREATE GOODS RECEIPT REQUEST MODAL */}
      {showReceiptModal && selectedProduct && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "24px",
            width: "100%",
            maxWidth: "540px",
            padding: "32px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            animation: "scaleUp 0.3s cubic-bezier(0.34, 1.3, 0.64, 1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.3rem", color: "#0f172a" }}>📝 Gửi Yêu Cầu Nhập Kho (Trình Admin Duyệt)</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: "#fffbeb",
              border: "1px solid #fcd34d",
              padding: "10px 14px",
              borderRadius: "12px",
              fontSize: "0.82rem",
              color: "#92400e",
              marginBottom: "16px",
              fontWeight: "500"
            }}>
              ℹ️ Yêu cầu sau khi gửi sẽ ở trạng thái <strong>Chờ Admin Duyệt</strong>. Sau khi Admin duyệt, hàng mới tự động cộng vào tồn kho.
            </div>

            <div style={{
              background: "#f8fafc",
              padding: "12px 16px",
              borderRadius: "14px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              border: "1px solid #e2e8f0"
            }}>
              <img
                src={selectedProduct.image || selectedProduct.images?.[0] || "https://via.placeholder.com/50"}
                alt={selectedProduct.name}
                style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px" }}
              />
              <div>
                <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.95rem" }}>{selectedProduct.name}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Tồn kho hiện tại: <strong>{selectedProduct.stock || 0} SP</strong></div>
              </div>
            </div>

            <form onSubmit={handleCreateReceiptSubmit} style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                  Số Lượng Nhập Thêm (SP) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={receiptForm.quantity}
                  onChange={(e) => setReceiptForm({ ...receiptForm, quantity: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "1rem", fontWeight: "700" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                  Đơn Giá Nhập Hàng (VNĐ) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={receiptForm.importPrice}
                  onChange={(e) => setReceiptForm({ ...receiptForm, importPrice: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "1rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                  Hình Ảnh Chứng Từ / Biên Lai Đính Kèm (Đường Dẫn URL Image) *
                </label>
                <input
                  type="text"
                  required
                  value={receiptForm.proofImage}
                  onChange={(e) => setReceiptForm({ ...receiptForm, proofImage: e.target.value })}
                  placeholder="https://... hoặc tên hình ảnh lô hàng đính kèm"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                  Nhà Cung Cấp / Đối Tác
                </label>
                <input
                  type="text"
                  value={receiptForm.supplier}
                  onChange={(e) => setReceiptForm({ ...receiptForm, supplier: e.target.value })}
                  placeholder="VD: Tổng Kho Apple Việt Nam"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                  Ghi Chú Nhập Kho
                </label>
                <textarea
                  rows="2"
                  value={receiptForm.note}
                  onChange={(e) => setReceiptForm({ ...receiptForm, note: e.target.value })}
                  placeholder="Ghi chú đợt hàng nhập..."
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>

              <div style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                padding: "10px 16px",
                borderRadius: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ fontSize: "0.85rem", color: "#047857", fontWeight: "600" }}>Tổng Giá Trị Yêu Cầu Nhập:</span>
                <span style={{ fontSize: "1.15rem", color: "#047857", fontWeight: "800" }}>
                  {formatPrice((receiptForm.quantity || 0) * (receiptForm.importPrice || 0))}đ
                </span>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontWeight: "600" }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.5,
                    padding: "12px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "#fff",
                    border: "none",
                    fontWeight: "700",
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(99,102,241,0.3)"
                  }}
                >
                  📤 Gửi Yêu Cầu Trình Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROOF IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            cursor: "pointer"
          }}
        >
          <img
            src={previewImage}
            alt="Chứng từ phóng to"
            style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: "16px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
          />
        </div>
      )}

    </div>
  );
}

export default WarehousePage;
