import { useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const allowedRoles = new Set(["admin", "staff", "user", "customer"]);

const initialLoginData = {
  email: "",
  password: "",
  remember: false,
};

const initialRegisterData = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

function App() {
  const [mode, setMode] = useState("login");
  const [loginData, setLoginData] = useState(initialLoginData);
  const [registerData, setRegisterData] = useState(initialRegisterData);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    clearMessage();
  };

  const handleLoginChange = (event) => {
    const { name, value, type, checked } = event.target;

    setLoginData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;

    setRegisterData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    clearMessage();

    if (!loginData.email || !loginData.password) {
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
          email: loginData.email,
          password: loginData.password,
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

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    clearMessage();

    if (
      !registerData.name ||
      !registerData.email ||
      !registerData.password ||
      !registerData.confirmPassword
    ) {
      setMessage("Dang ky that bai");
      setMessageType("error");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setMessage("Mat khau xac nhan khong dung");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          phone: registerData.phone,
          password: registerData.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.message || "Dang ky that bai");
        setMessageType("error");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setMessage("Dang ky thanh cong");
      setMessageType("success");
      setRegisterData(initialRegisterData);
      setMode("login");
      setLoginData((current) => ({
        ...current,
        email: registerData.email,
        password: "",
      }));
    } catch (error) {
      setMessage("Khong the ket noi den backend");
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
          <h1>{mode === "login" ? "Chao mung ban quay tro lai" : "Tao tai khoan moi"}</h1>
          <p className="brand-text">
            {mode === "login"
              ? "Dang nhap de quan ly don hang, cap nhat san pham va theo doi tinh hinh kinh doanh cua cua hang."
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
          <div className="mode-switch" role="tablist" aria-label="Authentication tabs">
            <button
              type="button"
              className={`mode-button ${mode === "login" ? "active" : ""}`}
              onClick={() => switchMode("login")}
            >
              Dang nhap
            </button>
            <button
              type="button"
              className={`mode-button ${mode === "register" ? "active" : ""}`}
              onClick={() => switchMode("register")}
            >
              Dang ky
            </button>
          </div>

          {mode === "login" ? (
            <>
              <div className="login-header">
                <p className="form-tag">Dang nhap tai khoan</p>
                <h2>Bat dau lam viec</h2>
                <p className="form-text">
                  Su dung email va mat khau cua ban de truy cap he thong.
                </p>
              </div>

              <form className="login-form" onSubmit={handleLoginSubmit}>
                <label className="field-group">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={handleLoginChange}
                  />
                </label>

                <label className="field-group">
                  <span>Mat khau</span>
                  <input
                    type="password"
                    name="password"
                    placeholder="Nhap mat khau"
                    value={loginData.password}
                    onChange={handleLoginChange}
                  />
                </label>

                <div className="form-row">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={loginData.remember}
                      onChange={handleLoginChange}
                    />
                    <span>Ghi nho dang nhap</span>
                  </label>
                  <a href="/" className="text-link">
                    Quen mat khau?
                  </a>
                </div>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSubmitting}
                >
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
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => switchMode("register")}
                >
                  Dang ky ngay
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="login-header">
                <p className="form-tag">Tao tai khoan moi</p>
                <h2>Dang ky nhanh</h2>
                <p className="form-text">
                  Dien day du thong tin de tao tai khoan nguoi dung moi.
                </p>
              </div>

              <form className="login-form" onSubmit={handleRegisterSubmit}>
                <label className="field-group">
                  <span>Ho va ten</span>
                  <input
                    type="text"
                    name="name"
                    placeholder="Nguyen Van A"
                    value={registerData.name}
                    onChange={handleRegisterChange}
                  />
                </label>

                <label className="field-group">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                  />
                </label>

                <label className="field-group">
                  <span>So dien thoai</span>
                  <input
                    type="text"
                    name="phone"
                    placeholder="0123456789"
                    value={registerData.phone}
                    onChange={handleRegisterChange}
                  />
                </label>

                <label className="field-group">
                  <span>Mat khau</span>
                  <input
                    type="password"
                    name="password"
                    placeholder="Nhap mat khau"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                  />
                </label>

                <label className="field-group">
                  <span>Xac nhan mat khau</span>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Nhap lai mat khau"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                  />
                </label>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Dang xu ly..." : "Dang ky tai khoan"}
                </button>

                {message ? <p className={`form-message ${messageType}`}>{message}</p> : null}
              </form>

              <p className="signup-text">
                Da co tai khoan?{" "}
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => switchMode("login")}
                >
                  Dang nhap
                </button>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
