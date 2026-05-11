import { useState } from "react";
import AuthShell from "./features/auth/AuthShell";
import LoginForm from "./features/auth/login/LoginForm";
import ForgotPasswordForm from "./features/auth/login/ForgotPasswordForm";
import RegisterForm from "./features/auth/register/RegisterForm";
import HomePage from "./features/home/HomePage";
import CartPage from "./features/cart/CartPage";

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
  const [page, setPage] = useState("home");
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

  const openAuthPage = (nextMode = "login") => {
    setPage("auth");
    setMode(nextMode);
    clearMessage();
  };

  const goHomePage = () => {
    setPage("home");
    clearMessage();
  };

  const openCartPage = () => {
    setPage("cart");
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
      setPage("auth");
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

  if (page === "home") {
    return <HomePage onOpenLogin={() => openAuthPage("login")} onOpenCart={openCartPage} />;
  }

  if (page === "cart") {
    return <CartPage onBackHome={goHomePage} />;
  }

  return (
    <AuthShell mode={mode} onSwitchMode={switchMode} onBackHome={goHomePage}>
      {mode === "login" ? (
        <LoginForm
          formData={loginData}
          isSubmitting={isSubmitting}
          message={message}
          messageType={messageType}
          onChange={handleLoginChange}
          onSubmit={handleLoginSubmit}
          onSwitchToRegister={() => openAuthPage("register")}
          onSwitchToForgotPassword={() => openAuthPage("forgotPassword")}
        />
      ) : mode === "forgotPassword" ? (
        <ForgotPasswordForm
          onSwitchToLogin={() => openAuthPage("login")}
        />
      ) : (
        <RegisterForm
          formData={registerData}
          isSubmitting={isSubmitting}
          message={message}
          messageType={messageType}
          onChange={handleRegisterChange}
          onSubmit={handleRegisterSubmit}
          onSwitchToLogin={() => openAuthPage("login")}
        />
      )}
    </AuthShell>
  );
}

export default App;
