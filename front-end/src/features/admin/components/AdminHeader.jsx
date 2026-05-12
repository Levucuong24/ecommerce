import React from "react";
import Logo from "../../../components/Logo";

const AdminHeader = ({ user, onLogout }) => {
  return (
    <header className="admin-custom-header">
      <div className="admin-header-content">
        <Logo className="admin-brand" />
        
        <div className="admin-user-section">
          {user ? (
            <div className="user-dropdown-wrapper">
              <span className="shop-login-link" style={{ cursor: 'pointer', color: '#fff' }}>Hi, {user.name}</span>
              <div className="user-dropdown-popup">
                <button type="button" onClick={() => window.location.href = "/home"} className="admin-dash-btn">
                  Quay lại trang chủ
                </button>
                <button type="button" onClick={onLogout} className="logout-btn">
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="shop-login-link" onClick={() => window.location.href = "/auth"}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
