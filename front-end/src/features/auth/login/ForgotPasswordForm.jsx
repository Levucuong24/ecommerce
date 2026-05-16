import { useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function ForgotPasswordForm({ onSwitchToLogin }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Có lỗi xảy ra, vui lòng thử lại sau");
      }

      setMessageType("success");
      setMessage(data.message || "Đã gửi mã OTP đến email của bạn!");
      setStep(2);
    } catch (err) {
      setMessageType("error");
      setMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setMessageType("success");
      setMessage("Đặt lại mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...");
      
      // Delay and switch back to login
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
    } catch (err) {
      setMessageType("error");
      setMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="login-header">
        <p className="form-tag">Khôi phục mật khẩu</p>
        <h2>Quên mật khẩu?</h2>
        <p className="form-text">
          {step === 1 
            ? "Vui lòng nhập email đã đăng ký để nhận mã xác nhận (OTP)."
            : "Vui lòng nhập mã OTP và mật khẩu mới của bạn."}
        </p>
      </div>

      {step === 1 ? (
        <form className="login-form" onSubmit={handleRequestOTP}>
          <label className="field-group">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </label>

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Đang gửi…" : "Gửi mã OTP"}
          </button>
        </form>
      ) : (
        <form className="login-form" onSubmit={handleResetPassword}>
          <label className="field-group">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              readOnly
            />
          </label>

          <label className="field-group">
            <span>Mã OTP</span>
            <input
              type="text"
              name="otp"
              placeholder="Nhập mã 6 số"
              value={formData.otp}
              onChange={handleInputChange}
              required
            />
          </label>

          <label className="field-group">
            <span>Mật khẩu mới</span>
            <input
              type="password"
              name="newPassword"
              placeholder="Nhập mật khẩu mới"
              value={formData.newPassword}
              onChange={handleInputChange}
              required
            />
          </label>

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý…" : "Đổi mật khẩu"}
          </button>
        </form>
      )}

      {message && (
        <div style={{ marginTop: '16px' }}>
          <p className={`form-message ${messageType}`}>{message}</p>
        </div>
      )}

      <div className="divider">
        <span>Hoặc</span>
      </div>

      <p className="signup-text" style={{ textAlign: 'center' }}>
        <button type="button" className="inline-action" onClick={onSwitchToLogin}>
          Quay lại đăng nhập
        </button>
      </p>
    </>
  );
}

export default ForgotPasswordForm;
