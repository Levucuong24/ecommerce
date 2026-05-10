function RegisterForm({
  formData,
  isSubmitting,
  message,
  messageType,
  onChange,
  onSubmit,
  onSwitchToLogin,
}) {
  return (
    <>
      <div className="login-header">
        <p className="form-tag">Tao tai khoan moi</p>
        <h2>Dang ky nhanh</h2>
        <p className="form-text">
          Dien day du thong tin de tao tai khoan nguoi dung moi.
        </p>
      </div>

      <form className="login-form" onSubmit={onSubmit}>
        <label className="field-group">
          <span>Ho va ten</span>
          <input
            type="text"
            name="name"
            placeholder="Nguyen Van A"
            value={formData.name}
            onChange={onChange}
          />
        </label>

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
          <span>So dien thoai</span>
          <input
            type="text"
            name="phone"
            placeholder="0123456789"
            value={formData.phone}
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

        <label className="field-group">
          <span>Xac nhan mat khau</span>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Nhap lai mat khau"
            value={formData.confirmPassword}
            onChange={onChange}
          />
        </label>

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Dang xu ly..." : "Dang ky tai khoan"}
        </button>

        {message ? <p className={`form-message ${messageType}`}>{message}</p> : null}
      </form>

      <p className="signup-text">
        Da co tai khoan?{" "}
        <button type="button" className="inline-action" onClick={onSwitchToLogin}>
          Dang nhap
        </button>
      </p>
    </>
  );
}

export default RegisterForm;
