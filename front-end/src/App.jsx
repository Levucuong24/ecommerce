import { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AuthShell from "./features/auth/AuthShell";
import LoginForm from "./features/auth/login/LoginForm";
import ForgotPasswordForm from "./features/auth/login/ForgotPasswordForm";
import RegisterForm from "./features/auth/register/RegisterForm";
import HomePage from "./features/home/HomePage";
import CategoryPage from "./features/home/CategoryPage";
import CartPage from "./features/cart/CartPage";
import ProductDetailPage from "./features/products/ProductDetailPage";
import ShopPage from "./features/shop/ShopPage";
import FollowingShopsPage from "./features/shop/FollowingShopsPage";
import AdminPage from "./features/admin/AdminPage";
import StaffPage from "./features/staff/StaffPage";
import { clearAuthSession, getAuthUser, saveAuthSession, getAuthToken } from "./utils/authStorage";
import { DATA_EVENTS, emitDataChanged } from "./utils/realtimeEvents";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const allowedRoles = new Set(["admin", "staff", "customer"]);

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
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getAuthUser());
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
    setMode(nextMode);
    clearMessage();
    navigate("/auth");
  };

  const goHomePage = () => {
    clearMessage();
    navigate("/home");
  };

  const getDefaultRouteByRole = (role) => {
    if (role === "admin") return "/admin";
    if (role === "staff") return "/staff";
    return "/home";
  };

  const handleLogout = async () => {
    // If the user is staff, set their store to offline before logging out
    if (user?.role === "staff") {
      try {
        const token = getAuthToken();
        // Use keepalive: true to ensure the request completes even if the page navigates
        fetch(`${apiUrl}/stores/online-status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isOnline: false }),
          keepalive: true,
        });
        
        // Emit event so other tabs update immediately
        emitDataChanged(DATA_EVENTS.STORES, { isOnline: false });
      } catch (err) {
        console.error("Error setting store offline during logout:", err);
      }
    }

    clearAuthSession();
    setUser(null);
    navigate("/home");
  };

  const openCartPage = () => {
    navigate("/cart");
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
      setMessage("Vui long nhap day du email va mat khau");
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
          email: loginData.email.trim(),
          password: loginData.password.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      const userRole = String(data?.user?.role || "").toLowerCase();

      if (!response.ok) {
        setMessage(data.message || "Dang nhap that bai");
        setMessageType("error");
        return;
      }

      if (!allowedRoles.has(userRole)) {
        clearAuthSession();
        setUser(null);
        setMessage("Tai khoan cua ban khong co quyen truy cap");
        setMessageType("error");
        return;
      }

      if (data.user) {
        saveAuthSession(data.token, data.user, loginData.remember);
        setUser(data.user);
        setMessage("Dang nhap thanh cong");
        setMessageType("success");

        setTimeout(() => {
          navigate(getDefaultRouteByRole(userRole));
        }, 1000);
      }
    } catch (error) {
      setMessage("Khong the ket noi den may chu");
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
      setMessage("Vui long dien day du cac thong tin bat buoc");
      setMessageType("error");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setMessage("Mat khau xac nhan khong khop");
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

      if (data.user) {
        saveAuthSession(data.token, data.user);
        setUser(data.user);
      }

      setMessage("Dang ky thanh cong!");
      setMessageType("success");
      setRegisterData(initialRegisterData);

      setTimeout(() => {
        setMode("login");
        setLoginData((current) => ({
          ...current,
          email: registerData.email,
          password: "",
        }));
        navigate("/home");
      }, 1500);
    } catch (error) {
      setMessage("Khong the ket noi den may chu");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route
        path="/home"
        element={
          <HomePage
            user={user}
            onLogout={handleLogout}
            onOpenLogin={() => openAuthPage("login")}
            onOpenCart={openCartPage}
          />
        }
      />
      <Route path="/cart" element={<CartPage onBackHome={goHomePage} />} />
      <Route
        path="/product/:id"
        element={
          <ProductDetailPage
            user={user}
            onLogout={handleLogout}
            onOpenLogin={() => openAuthPage("login")}
            onOpenCart={openCartPage}
          />
        }
      />
      <Route
        path="/shop/:id"
        element={
          <ShopPage
            user={user}
            onLogout={handleLogout}
            onOpenLogin={() => openAuthPage("login")}
            onOpenCart={openCartPage}
          />
        }
      />
      <Route
        path="/following-shops"
        element={
          <FollowingShopsPage
            user={user}
            onLogout={handleLogout}
            onOpenLogin={() => openAuthPage("login")}
            onOpenCart={openCartPage}
          />
        }
      />
      <Route
        path="/auth"
        element={
          <AuthShell mode={mode} onSwitchMode={switchMode} onBackHome={goHomePage}>
            {mode === "login" ? (
              <LoginForm
                formData={loginData}
                isSubmitting={isSubmitting}
                message={message}
                messageType={messageType}
                onChange={handleLoginChange}
                onSubmit={handleLoginSubmit}
                onSwitchToRegister={() => switchMode("register")}
                onSwitchToForgotPassword={() => switchMode("forgotPassword")}
              />
            ) : mode === "forgotPassword" ? (
              <ForgotPasswordForm onSwitchToLogin={() => switchMode("login")} />
            ) : (
              <RegisterForm
                formData={registerData}
                isSubmitting={isSubmitting}
                message={message}
                messageType={messageType}
                onChange={handleRegisterChange}
                onSubmit={handleRegisterSubmit}
                onSwitchToLogin={() => switchMode("login")}
              />
            )}
          </AuthShell>
        }
      />
      <Route
        path="/admin"
        element={
          user?.role === "admin" ? (
            <AdminPage
              user={user}
              onOpenLogin={() => openAuthPage("login")}
              onOpenCart={openCartPage}
              handleLogout={handleLogout}
            />
          ) : (
            <Navigate to={user ? getDefaultRouteByRole(user.role) : "/auth"} replace />
          )
        }
      />
      <Route
        path="/staff"
        element={
          user?.role === "staff" ? (
            <StaffPage user={user} handleLogout={handleLogout} />
          ) : (
            <Navigate to={user ? getDefaultRouteByRole(user.role) : "/auth"} replace />
          )
        }
      />
      <Route
        path="/:categorySlug"
        element={
          <CategoryPage
            user={user}
            onLogout={handleLogout}
            onOpenLogin={() => openAuthPage("login")}
            onOpenCart={openCartPage}
          />
        }
      />
    </Routes>
  );
}

export default App;
