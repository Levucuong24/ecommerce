import Logo from "../../components/Logo";

function AuthShell({ mode, onSwitchMode, onBackHome, children }) {
  return (
    <main className="login-page">
      <section className="brand-panel">
        <div className="brand-copy">
          <Logo className="brand-logo" />
          <p className="brand-tag">Ecommerce Platform</p>
          <h1>
            {mode === "login" 
              ? "Chào mừng bạn quay trở lại" 
              : mode === "forgotPassword" 
                ? "Khôi phục mật khẩu" 
                : "Tạo tài khoản mới"}
          </h1>
          <p className="brand-text">
            {mode === "login"
              ? "Đăng nhập để quản lý đơn hàng, cập nhật sản phẩm và theo dõi tình hình kinh doanh của cửa hàng bạn một cách hiệu quả."
              : mode === "forgotPassword"
                ? "Nhập email của bạn để nhận mã khôi phục mật khẩu và tiếp tục trải nghiệm dịch vụ."
                : "Tham gia cùng chúng tôi để bắt đầu mua sắm, quản lý thông tin cá nhân và nhận những ưu đãi hấp dẫn nhất."}
          </p>
        </div>

        <div className="brand-metrics">
          <article className="metric-card">
            <span>Hôm nay</span>
            <strong>128 đơn hàng</strong>
          </article>
          <article className="metric-card">
            <span>Doanh thu</span>
            <strong>84.500.000đ</strong>
          </article>
          <article className="metric-card">
            <span>Khách quay lại</span>
            <strong>64%</strong>
          </article>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <button
            type="button"
            className="back-home-button"
            onClick={onBackHome}
            aria-label="Quay lai trang chu"
          >
            {"<"}
          </button>

          <div className="mode-switch" role="tablist" aria-label="Authentication tabs">
            <button
              type="button"
              className={`mode-button ${mode === "login" ? "active" : ""}`}
              onClick={() => onSwitchMode("login")}
            >
              Dang nhap
            </button>
            <button
              type="button"
              className={`mode-button ${mode === "register" ? "active" : ""}`}
              onClick={() => onSwitchMode("register")}
            >
              Dang ky
            </button>
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}

export default AuthShell;
