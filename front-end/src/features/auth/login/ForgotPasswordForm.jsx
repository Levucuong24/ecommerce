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

  const handleChange = (e) => {
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
        throw new Error(data.message || "Something went wrong");
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
      setMessage("Password reset successful. You can now login.");
      
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
        <p className="form-tag">Khoi phuc mat khau</p>
        <h2>Quen mat khau?</h2>
        <p className="form-text">
          {step === 1 
            ? "Vui long nhap email da dang ky de nhan ma xac nhan (OTP)."
            : "Vui long nhap ma OTP va mat khau moi cua ban."}
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
              onChange={handleChange}
              required
            />
          </label>

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Dang gui..." : "Gui ma OTP"}
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
            />
          </label>

          <label className="field-group">
            <span>Ma OTP</span>
            <input
              type="text"
              name="otp"
              placeholder="Nhap ma 6 so"
              value={formData.otp}
              onChange={handleChange}
              required
            />
          </label>

          <label className="field-group">
            <span>Mat khau moi</span>
            <input
              type="password"
              name="newPassword"
              placeholder="Nhap mat khau moi"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />
          </label>

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Dang xu ly..." : "Doi mat khau"}
          </button>
        </form>
      )}

      {message && (
        <div style={{ marginTop: '16px' }}>
          <p className={`form-message ${messageType}`}>{message}</p>
        </div>
      )}

      <div className="divider">
        <span>Hoac</span>
      </div>

      <p className="signup-text" style={{ textAlign: 'center' }}>
        <button type="button" className="inline-action" onClick={onSwitchToLogin}>
          Quay lai dang nhap
        </button>
      </p>
    </>
  );
}

export default ForgotPasswordForm;
