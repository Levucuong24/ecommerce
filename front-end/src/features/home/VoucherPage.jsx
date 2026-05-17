import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";

function VoucherPage({ user, onLogout, onOpenLogin, onOpenCart }) {
  const navigate = useNavigate();

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
          <div className="voucher-item">
            <div className="voucher-info">
              <h4>Giảm 17%</h4>
              <p>Đơn Tối Thiểu 100k</p>
              <p className="voucher-exp">HSD: 30/06/2026</p>
            </div>
            <button className="save-voucher-btn" onClick={() => {
              if (!user) {
                alert("Vui lòng đăng nhập để lưu mã giảm giá.");
                onOpenLogin();
              } else {
                alert("Đã lưu mã giảm giá!");
              }
            }}>Lưu</button>
          </div>
          <div className="voucher-item">
            <div className="voucher-info">
              <h4>Giảm 25K</h4>
              <p>Đơn Tối Thiểu 200k</p>
              <p className="voucher-exp">HSD: 30/06/2026</p>
            </div>
            <button className="save-voucher-btn" onClick={() => {
              if (!user) {
                alert("Vui lòng đăng nhập để lưu mã giảm giá.");
                onOpenLogin();
              } else {
                alert("Đã lưu mã giảm giá!");
              }
            }}>Lưu</button>
          </div>
          <div className="voucher-item">
            <div className="voucher-info">
              <h4>Miễn Phí Vận Chuyển</h4>
              <p>Đơn Tối Thiểu 50k</p>
              <p className="voucher-exp">HSD: 30/06/2026</p>
            </div>
            <button className="save-voucher-btn" onClick={() => {
              if (!user) {
                alert("Vui lòng đăng nhập để lưu mã giảm giá.");
                onOpenLogin();
              } else {
                alert("Đã lưu mã giảm giá!");
              }
            }}>Lưu</button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default VoucherPage;
