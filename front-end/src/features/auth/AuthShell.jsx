import Logo from "../../components/Logo";

function AuthShell({ mode, onSwitchMode, onBackHome, children }) {
  return (
    <main className="login-page">
      <section className="brand-panel">
        <div className="brand-copy">
          <Logo className="brand-logo" />
          <p className="brand-tag">Ecommerce Admin</p>
          <h1>
            {mode === "login" 
              ? "Chao mung ban quay tro lai" 
              : mode === "forgotPassword" 
                ? "Khoi phuc mat khau" 
                : "Tao tai khoan moi"}
          </h1>
          <p className="brand-text">
            {mode === "login"
              ? "Dang nhap de quan ly don hang, cap nhat san pham va theo doi tinh hinh kinh doanh cua cua hang."
              : mode === "forgotPassword"
                ? "Nhap email cua ban de nhan ma khoi phuc mat khau."
                : "Dang ky tai khoan de bat dau mua sam, quan ly thong tin ca nhan va theo doi don hang cua ban."}
          </p>
        </div>

        <div className="brand-metrics">
          <article className="metric-card">
            <span>Hom nay</span>
            <strong>128 don hang</strong>
          </article>
          <article className="metric-card">
            <span>Doanh thu</span>
            <strong>84.500.000 VND</strong>
          </article>
          <article className="metric-card">
            <span>Khach quay lai</span>
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
