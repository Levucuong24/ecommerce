import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";
import { mockVouchers } from "./utils";

function VoucherPage({ user, onLogout, onOpenLogin, onOpenCart }) {
  const navigate = useNavigate();
  const [savedVouchers, setSavedVouchers] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedVouchers") || "[]");
    setSavedVouchers(saved);
  }, []);

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
