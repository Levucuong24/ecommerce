function LoginForm({
  formData,
  isSubmitting,
  message,
  messageType,
  onChange,
  onSubmit,
  onSwitchToRegister,
}) {
  return (
    <>
      <div className="login-header">
        <p className="form-tag">Dang nhap tai khoan</p>
        <h2>Bat dau lam viec</h2>
        <p className="form-text">
          Su dung email va mat khau cua ban de truy cap he thong.
        </p>
      </div>

      <form className="login-form" onSubmit={onSubmit}>
        <label className="field-group">
          <span>Email</span>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={onChange}
          />
        </label>

        <label className="field-group">
          <span>Mat khau</span>
          <input
            type="password"
            name="password"
            placeholder="Nhap mat khau"
            value={formData.password}
            onChange={onChange}
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
            <span>Ghi nho dang nhap</span>
          </label>
          <a href="/" className="text-link">
            Quen mat khau?
          </a>
        </div>

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Dang xu ly..." : "Dang nhap"}
        </button>

        {message ? <p className={`form-message ${messageType}`}>{message}</p> : null}
      </form>

      <div className="divider">
        <span>Hoac tiep tuc voi</span>
      </div>

      <div className="social-actions">
        <button type="button" className="secondary-button">
          Google
        </button>
        <button type="button" className="secondary-button">
          Facebook
        </button>
      </div>

      <p className="signup-text">
        Chua co tai khoan?{" "}
        <button type="button" className="inline-action" onClick={onSwitchToRegister}>
          Dang ky ngay
        </button>
      </p>
    </>
  );
}

export default LoginForm;
