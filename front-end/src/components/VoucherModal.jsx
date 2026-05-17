import { useState, useEffect } from "react";
import { mockVouchers } from "../features/home/utils";

export default function VoucherModal({ onClose }) {
  const [savedVouchers, setSavedVouchers] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedVouchers") || "[]");
    setSavedVouchers(saved);
  }, []);

  const handleSave = (voucher) => {
    if (savedVouchers.includes(voucher.id)) return;
    
    if (window.confirm(`Bạn có chắc chắn muốn lưu mã "${voucher.title}" không?`)) {
      const newSaved = [...savedVouchers, voucher.id];
      setSavedVouchers(newSaved);
      localStorage.setItem("savedVouchers", JSON.stringify(newSaved));
      alert("Đã lưu mã giảm giá! Bạn có thể sử dụng mã này ở trang Giỏ hàng.");
    }
  };

  return (
    <div className="voucher-modal-overlay" onClick={onClose}>
      <div className="voucher-modal" onClick={e => e.stopPropagation()}>
        <div className="voucher-modal-header">
          <h3>Mã Giảm Giá</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="voucher-list">
          {mockVouchers.filter(v => v.id !== 'v3').map(voucher => (
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
      </div>
    </div>
  );
}
