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
        <p className="form-tag">Tạo tài khoản mới</p>
        <h2>Đăng ký nhanh</h2>
        <p className="form-text">
          Điền đầy đủ thông tin để tạo tài khoản người dùng mới.
        </p>
      </div>

      <form className="login-form" onSubmit={onSubmit}>
        <label className="field-group">
          <span>Ho va ten</span>
          <input
            type="text"
            name="name"
            placeholder="Ví dụ: Nguyễn Văn A"
            value={formData.name}
            onChange={onChange}
            required
          />
        </label>

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
          <span>So dien thoai</span>
          <input
            type="text"
            name="phone"
            placeholder="Ví dụ: 0123456789"
            value={formData.phone}
            onChange={onChange}
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

        <label className="field-group">
          <span>Xac nhan mat khau</span>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Nhập lại mật khẩu"
            value={formData.confirmPassword}
            onChange={onChange}
            required
          />
        </label>

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Đang xử lý..." : "Đăng ký tài khoản"}
        </button>

        {message ? <p className={`form-message ${messageType}`}>{message}</p> : null}
      </form>

      <p className="signup-text">
        Đã có tài khoản?{" "}
        <button type="button" className="inline-action" onClick={onSwitchToLogin}>
          Đăng nhập
        </button>
      </p>
    </>
  );
}

export default RegisterForm;
