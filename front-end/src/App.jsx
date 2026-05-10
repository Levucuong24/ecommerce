import { useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const allowedRoles = new Set(["admin", "staff", "user", "customer"]);

function App() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email || !formData.password) {
      setMessage("fail");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      const userRole = String(data?.user?.role || "").toLowerCase();

      if (!response.ok || !allowedRoles.has(userRole)) {
        setMessage("fail");
        setMessageType("error");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setMessage("Login thanh cong");
      setMessageType("success");
    } catch (error) {
      setMessage("fail");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="brand-panel">
        <div className="brand-copy">
          <p className="brand-tag">Ecommerce Admin</p>
          <h1>Chao mung ban quay tro lai</h1>
          <p className="brand-text">
            Dang nhap de quan ly don hang, cap nhat san pham va theo doi tinh
            hinh kinh doanh cua cua hang.
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
          <div className="login-header">
            <p className="form-tag">Dang nhap tai khoan</p>
            <h2>Bat dau lam viec</h2>
            <p className="form-text">
              Su dung email va mat khau cua ban de truy cap he thong.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field-group">
              <span>Email</span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </label>

            <label className="field-group">
              <span>Mat khau</span>
              <input
                type="password"
                name="password"
                placeholder="Nhap mat khau"
                value={formData.password}
                onChange={handleChange}
              />
            </label>

            <div className="form-row">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
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

            {message ? (
              <p className={`form-message ${messageType}`}>{message}</p>
            ) : null}
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
            Chua co tai khoan? <a href="/">Dang ky ngay</a>
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;
