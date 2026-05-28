import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";
import { mockVouchers } from "./utils";
import { getAuthToken } from "../../utils/authStorage";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function VoucherPage({ user, onLogout, onOpenLogin, onOpenCart }) {
  const navigate = useNavigate();
  const [savedVouchers, setSavedVouchers] = useState([]);
  const [apiCoupons, setApiCoupons] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedVouchers") || "[]");
    setSavedVouchers(saved);
  }, []);

  useEffect(() => {
    const syncMockVouchers = async () => {
      if (!user) return;
      try {
        const response = await fetch(`${apiUrl}/orders/my`, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const saved = JSON.parse(localStorage.getItem("savedVouchers") || "[]");
          let updated = [...saved];
          let changed = false;
          
          // 1. Remove mock vouchers that are used in active orders (pending, processing, completed)
          const activeUsedMockVouchers = data
            .filter(o => o.orderStatus !== "cancelled")
            .map(o => o.voucherId)
            .filter(vid => vid && vid.startsWith('v'));
            
          const beforeLen = updated.length;
          updated = updated.filter(vid => !activeUsedMockVouchers.includes(vid));
          if (updated.length !== beforeLen) {
            changed = true;
          }

          // 2. Restore mock vouchers that were used in cancelled orders (and are not used in any active orders)
          const cancelledMockVouchers = data
            .filter(o => o.orderStatus === "cancelled")
            .map(o => o.voucherId)
            .filter(vid => vid && vid.startsWith('v'));

          for (const vid of cancelledMockVouchers) {
            if (!activeUsedMockVouchers.includes(vid) && !updated.includes(vid)) {
              updated.push(vid);
              changed = true;
            }
          }

          if (changed) {
            localStorage.setItem("savedVouchers", JSON.stringify(updated));
            setSavedVouchers(updated);
          }
        }
      } catch (err) {
        console.error("Error syncing mock vouchers:", err);
      }
    };
    syncMockVouchers();
  }, [user]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const url = user
          ? `${apiUrl}/coupons?userId=${user._id || user.id}`
          : `${apiUrl}/coupons`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.items)) {
            setApiCoupons(data.items);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải coupon:", error);
      }
    };
    fetchCoupons();
  }, [user]);

  const handleSave = (voucher) => {
    if (!user) {
      alert("Vui lòng đăng nhập để lưu mã giảm giá.");
      onOpenLogin();
      return;
    }
    
    if (savedVouchers.includes(voucher.id)) return;
    
    if (window.confirm(`Bạn có chắc chắn muốn lưu mã "${voucher.title}" không?`)) {
      const newSaved = [...savedVouchers, voucher.id];
      setSavedVouchers(newSaved);
      localStorage.setItem("savedVouchers", JSON.stringify(newSaved));
      alert("Đã lưu mã giảm giá! Bạn có thể sử dụng mã này ở trang Giỏ hàng.");
    }
  };

  return (
    <main className="following-shops-page">
      <Header
        user={user}
        onOpenLogin={onOpenLogin}
        onOpenCart={onOpenCart}
        onLogout={onLogout}
        onSearch={() => navigate("/home")}
      />
      <section className="content-shell following-shops-content">
        <h2>Kho Voucher Của Bạn</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {/* API Coupons (Like Welcome Voucher) */}
          {apiCoupons
            .filter(v => v.isActive !== false && (!v.expiredAt || new Date(v.expiredAt) > new Date()))
            .map(voucher => (
            <div className="voucher-item" key={voucher._id} style={{ border: '1px solid var(--primary)', background: '#fff9f9' }}>
              <div className="voucher-info">
                <h4 style={{ color: 'var(--primary)' }}>{voucher.code.startsWith('WELCOME') ? "Voucher Người Mới" : voucher.code}</h4>
                <p style={{ fontWeight: '600', fontSize: '16px' }}>Giảm {voucher.value}{voucher.discountType === 'percentage' ? '%' : 'đ'}</p>
                <p>Đơn Tối Thiểu {(voucher.minOrder || 0).toLocaleString("vi-VN")}đ</p>
                {voucher.expiredAt && (
                  <p className="voucher-exp">HSD: {new Date(voucher.expiredAt).toLocaleDateString("vi-VN")}</p>
                )}
              </div>
              <button 
                className="save-voucher-btn" 
                style={{ background: '#ccc', cursor: 'default' }}
                disabled
              >
                Sẵn có
              </button>
            </div>
          ))}

          {/* Mock Vouchers */}
          {mockVouchers.map(voucher => (
            <div className="voucher-item" key={voucher.id}>
              <div className="voucher-info">
                <h4>{voucher.title}</h4>
                <p>Đơn Tối Thiểu {voucher.minOrder.toLocaleString("vi-VN")}đ</p>
                <p className="voucher-exp">HSD: {voucher.exp}</p>
              </div>
              <button 
                className="save-voucher-btn" 
                onClick={() => handleSave(voucher)}
                disabled={savedVouchers.includes(voucher.id)}
                style={savedVouchers.includes(voucher.id) ? { background: '#ccc', cursor: 'not-allowed' } : {}}
              >
                {savedVouchers.includes(voucher.id) ? "Đã Lưu" : "Lưu"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default VoucherPage;
