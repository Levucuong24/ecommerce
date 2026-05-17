import { GoogleLogin } from "@react-oauth/google";

function LoginForm({
  formData,
  isSubmitting,
  message,
  messageType,
  onChange,
  onSubmit,
  onSwitchToRegister,
  onSwitchToForgotPassword,
  onGoogleLogin,
}) {
  return (
    <>
      <div className="login-header">
        <p className="form-tag">Đăng nhập tài khoản</p>
        <h2>Bắt đầu làm việc</h2>
        <p className="form-text">
          Sử dụng email và mật khẩu của bạn để truy cập hệ thống.
        </p>
      </div>

      <form className="login-form" onSubmit={onSubmit}>
        <label className="field-group">
          <span>Email</span>
          <input
            type="email"
            name="email"
            placeholder="Ví dụ: ban@example.com"
            value={formData.email}
            onChange={onChange}
            required
          />
        </label>

        <label className="field-group">
          <span>Mat khau</span>
          <input
            type="password"
            name="password"
            placeholder="Nhập mật khẩu"
            value={formData.password}
            onChange={onChange}
            required
          />
        </label>

        <div className="form-row">
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="remember"
              checked={formData.remember}
              onChange={onChange}
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <button type="button" className="text-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={onSwitchToForgotPassword}>
            Quên mật khẩu?
          </button>
        </div>

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
        </button>

        {message ? <p className={`form-message ${messageType}`}>{message}</p> : null}
      </form>

      <div className="divider">
        <span>Hoặc tiếp tục với</span>
      </div>

      <div className="social-actions" style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <GoogleLogin
          onSuccess={onGoogleLogin}
          onError={() => alert("Đăng nhập Google thất bại. Vui lòng thử lại.")}
          text="signin_with"
          shape="rectangular"
          locale="vi"
          size="large"
        />
        <button type="button" className="secondary-button">
          Facebook
        </button>
      </div>

      <p className="signup-text">
        Chưa có tài khoản?{" "}
        <button type="button" className="inline-action" onClick={onSwitchToRegister}>
          Đăng ký ngay
        </button>
      </p>
    </>
  );
}

export default LoginForm;
