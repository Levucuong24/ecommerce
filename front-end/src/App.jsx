import { useState, useEffect, useRef } from "react";
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
import LikedProductsPage from "./features/shop/LikedProductsPage";
import VoucherPage from "./features/home/VoucherPage";
import OrderHistoryPage from "./features/shop/OrderHistoryPage";
import ProfilePage from "./features/shop/ProfilePage";
import WarehousePage from "./features/warehouse/WarehousePage";
import { clearAuthSession, getAuthUser, saveAuthSession, getAuthToken } from "./utils/authStorage";
import { DATA_EVENTS, emitDataChanged, subscribeDataChanged } from "./utils/realtimeEvents";
import ChatWidget from "./components/ChatWidget";
import NotFound from "./components/NotFound";


const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const allowedRoles = new Set(["admin", "staff", "customer", "warehouse"]);

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
  const [activeChatStore, setActiveChatStore] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [coinsStatus, setCoinsStatus] = useState({ coins: 0, checkedInToday: false });
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [spinTransition, setSpinTransition] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const canvasRef = useRef(null);

  const fetchCoinsStatus = async () => {
    if (!user) return;
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(`${apiUrl}/users/coins-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCoinsStatus(data);
      }
    } catch (err) {
      console.error("Lỗi lấy trạng thái xu:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCoinsStatus();
      const unsubscribe = subscribeDataChanged((event) => {
        if (event.type === DATA_EVENTS.USERS) {
          fetchCoinsStatus();
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleCheckIn = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiUrl}/users/check-in`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCoinsStatus({ coins: data.coins, checkedInToday: true });
        alert(`Chúc mừng! Bạn đã điểm danh thành công và nhận được ${data.coinsAwarded} xu! 🪙`);
        emitDataChanged(DATA_EVENTS.USERS);
      } else {
        const err = await res.json();
        alert(err.message || "Điểm danh thất bại");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi hệ thống khi điểm danh");
    }
  };

  const drawWheel = (canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    
    ctx.clearRect(0, 0, size, size);
    
    const prizes = [
      { text: "Chúc may mắn 🍀", color: "#94a3b8" },
      { text: "50 Xu 🪙", color: "#fbbf24" },
      { text: "Voucher 10% 🎟️", color: "#ec4899" },
      { text: "200 Xu 🪙", color: "#f59e0b" },
      { text: "Voucher 20k 🎟️", color: "#8b5cf6" },
      { text: "500 Xu 🪙", color: "#10b981" },
    ];
    
    const sliceAngle = (2 * Math.PI) / 6;
    
    prizes.forEach((prize, index) => {
      const angle = index * sliceAngle;
      
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 4;
      ctx.fillText(prize.text, radius - 15, 5);
      ctx.restore();
    });
    
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  useEffect(() => {
    if (showSpinModal && canvasRef.current) {
      drawWheel(canvasRef.current);
    }
  }, [showSpinModal]);

  const handleStartSpin = async () => {
    if (isSpinning) return;
    
    if ((coinsStatus.coins || 0) < 100) {
      alert("Bạn không đủ xu để thực hiện vòng quay! Mỗi lượt quay tốn 100 xu.");
      return;
    }

    setIsSpinning(true);
    setSpinTransition("");
    
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiUrl}/users/spin-wheel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        const targetSectorAngle = 270 - (data.prizeIndex * 60 + 30);
        const finalAngle = spinAngle + 1800 + targetSectorAngle - (spinAngle % 360);
        
        setSpinTransition("transform 4.5s cubic-bezier(0.15, 0.85, 0.35, 1)");
        setSpinAngle(finalAngle);
        
        setTimeout(() => {
          setIsSpinning(false);
          setCoinsStatus(prev => ({ ...prev, coins: data.remainingCoins }));
          
          if (data.prizeType === "none") {
            alert("Rất tiếc! Chúc bạn may mắn lần sau. 🍀");
          } else if (data.prizeType === "coins") {
            alert(`Chúc mừng! Bạn đã trúng thêm ${data.coinsAwarded} xu! 🪙`);
          } else if (data.prizeType === "voucher") {
            alert(`Chúc mừng! Bạn đã trúng Voucher giảm giá: ${data.couponCode} 🎟️.\nMã giảm giá này đã được tự động thêm vào kho Voucher của bạn và có hạn dùng trong 7 ngày!`);
          }
          
          emitDataChanged(DATA_EVENTS.USERS);
        }, 4700);

      } else {
        const err = await res.json();
        alert(err.message || "Quay thưởng thất bại");
        setIsSpinning(false);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi thực hiện vòng quay");
      setIsSpinning(false);
    }
  };

  const refreshUserProfile = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user && data.token) {
          const remember = localStorage.getItem("auth_remember") === "true";
          saveAuthSession(data.token, data.user, remember);
          setUser(data.user);
        }
      }
    } catch (err) {
      console.error("Error refreshing user profile:", err);
    }
  };

  useEffect(() => {
    refreshUserProfile();
  }, []);

  useEffect(() => {
    if (!user) return;

    const pendingItemStr = localStorage.getItem("pending_cart_item");
    if (!pendingItemStr) return;

    let pendingItem;
    try {
      pendingItem = JSON.parse(pendingItemStr);
    } catch (e) {
      console.error("Error parsing pending_cart_item:", e);
      localStorage.removeItem("pending_cart_item");
      return;
    }

    localStorage.removeItem("pending_cart_item");

    if (!pendingItem || !pendingItem.productId) return;

    const token = getAuthToken();
    if (!token) return;

    fetch(`${apiUrl}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId: pendingItem.productId,
        quantity: pendingItem.quantity || 1,
        color: pendingItem.color,
      }),
    })
      .then((res) => {
        if (res.ok) {
          emitDataChanged(DATA_EVENTS.PRODUCTS);
          if (pendingItem.isBuyNow) {
            navigate("/cart");
          }
        }
      })
      .catch((err) => {
        console.error("Error adding pending item to cart:", err);
      });
  }, [user, navigate]);

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

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const response = await fetch(`${apiUrl}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await response.json();
      if (response.ok && data.user) {
        saveAuthSession(data.token, data.user, false);

        const pendingItemStr = localStorage.getItem("pending_cart_item");
        let isBuyNow = false;
        if (pendingItemStr) {
          try {
            const item = JSON.parse(pendingItemStr);
            isBuyNow = item.isBuyNow;
          } catch (e) {}
        }

        setUser(data.user);

        if (!isBuyNow) {
          const userId = data.user._id || data.user.id;
          navigate(getDefaultRouteByRole(data.user.role, userId));
        }
      } else {
        setMessage(data.message || "Đăng nhập Google thất bại");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Không thể kết nối đến máy chủ");
      setMessageType("error");
    }
  };

  const getDefaultRouteByRole = (role, userId) => {
    if (role === "admin") return "/admin";
    if (role === "staff") return "/staff";
    if (role === "warehouse") return "/warehouse";
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

        const pendingItemStr = localStorage.getItem("pending_cart_item");
        let isBuyNow = false;
        if (pendingItemStr) {
          try {
            const item = JSON.parse(pendingItemStr);
            isBuyNow = item.isBuyNow;
          } catch (e) {}
        }

        setUser(data.user);
        setMessage("Dang nhap thanh cong");
        setMessageType("success");

        setTimeout(() => {
          if (!isBuyNow) {
            const userId = data.user?._id || data.user?.id;
            navigate(getDefaultRouteByRole(userRole, userId));
          }
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
      !registerData.phone ||
      !registerData.password ||
      !registerData.confirmPassword
    ) {
      setMessage("Vui long dien day du cac thong tin bat buoc");
      setMessageType("error");
      return;
    }

    if (!registerData.email.toLowerCase().endsWith("@gmail.com")) {
      setMessage("Email đăng ký phải có đuôi @gmail.com");
      setMessageType("error");
      return;
    }

    const cleanPhone = registerData.phone.trim();
    const allowedPrefixes = [
      "032", "033", "034", "035", "036", "037", "038", "039", 
      "086", "096", "097", "098", 
      "081", "082", "083", "084", "085", "088", "091", "094", 
      "070", "076", "077", "078", "079", "089", "090", "093", 
      "052", "056", "058", "092", "059", "099"
    ];
    const isValid = cleanPhone.length === 10 && allowedPrefixes.some(prefix => cleanPhone.startsWith(prefix)) && /^\d+$/.test(cleanPhone);
    if (!isValid) {
      setMessage("Số điện thoại không hợp lệ hoặc không thuộc nhà mạng được hỗ trợ");
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
    <>
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

        <Route 
          path="/cart" 
          element={
            <CartPage 
              user={user} 
              onLogout={handleLogout}
              onOpenLogin={() => openAuthPage("login")}
              onBackHome={goHomePage} 
            />
          } 
        />
        <Route
          path="/product/:id"
          element={
            <ProductDetailPage
              user={user}
              onLogout={handleLogout}
              onOpenLogin={() => openAuthPage("login")}
              onOpenCart={openCartPage}
              onChatWithStore={(store) => setActiveChatStore(store)}
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
              onChatWithStore={(store) => setActiveChatStore(store)}
            />
          }
        />
        <Route
          path="/liked-products"
          element={
            <LikedProductsPage
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
          path="/vouchers"
          element={
            <VoucherPage
              user={user}
              onLogout={handleLogout}
              onOpenLogin={() => openAuthPage("login")}
              onOpenCart={openCartPage}
            />
          }
        />
        <Route
          path="/orders/history"
          element={
            <OrderHistoryPage
              user={user}
              onLogout={handleLogout}
              onOpenLogin={() => openAuthPage("login")}
              onOpenCart={openCartPage}
            />
          }
        />
        <Route
          path="/profile"
          element={
            <ProfilePage
              user={user}
              onLogout={handleLogout}
              onOpenLogin={() => openAuthPage("login")}
              onOpenCart={openCartPage}
              onUpdateUser={(updatedUser) => {
                const remember = localStorage.getItem("auth_remember") === "true";
                const token = getAuthToken();
                saveAuthSession(token, updatedUser, remember);
                setUser(updatedUser);
              }}
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
                  onGoogleLogin={handleGoogleLogin}
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
            user && (user.role === "staff" || user.role === "customer") ? (
              <StaffPage user={user} handleLogout={handleLogout} refreshUserProfile={refreshUserProfile} />
            ) : (
              <Navigate to={user ? getDefaultRouteByRole(user.role) : "/auth"} replace />
            )
          }
        />
        <Route
          path="/warehouse"
          element={
            user && (user.role === "warehouse" || user.role === "admin") ? (
              <WarehousePage user={user} onLogout={handleLogout} />
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
        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
      <ChatWidget activeStore={activeChatStore} onClose={() => setActiveChatStore(null)} currentUser={user} />

      {/* Nút nổi Điểm danh nhận xu */}
      {user && (
        <button
          onClick={() => setShowCheckInModal(true)}
          style={{
            position: "fixed",
            bottom: "100px",
            right: "24px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
            border: "none",
            boxShadow: "0 4px 15px rgba(217, 119, 6, 0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "26px",
            zIndex: 999,
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            animation: coinsStatus.checkedInToday ? "none" : "pulseCheckIn 2s infinite",
          }}
          title="Điểm danh nhận xu hàng ngày"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1) translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(217, 119, 6, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1) translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(217, 119, 6, 0.4)";
          }}
        >
          🪙
        </button>
      )}

      {/* Nút nổi Vòng quay may mắn */}
      {user && (
        <button
          onClick={() => setShowSpinModal(true)}
          style={{
            position: "fixed",
            bottom: "164px",
            right: "24px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
            border: "none",
            boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "26px",
            zIndex: 999,
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            animation: coinsStatus.coins >= 100 ? "pulseSpinButton 2s infinite" : "none",
          }}
          title="Vòng quay may mắn nhận Voucher"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1) translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1) translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(139, 92, 246, 0.4)";
          }}
        >
          🎡
        </button>
      )}

      {/* CSS Keyframes cho hiệu ứng nhấp nháy của nút */}
      <style>{`
        @keyframes pulseCheckIn {
          0% { transform: scale(1); box-shadow: 0 4px 15px rgba(217, 119, 6, 0.4); }
          50% { transform: scale(1.1); box-shadow: 0 4px 25px rgba(217, 119, 6, 0.7); }
          100% { transform: scale(1); box-shadow: 0 4px 15px rgba(217, 119, 6, 0.4); }
        }
        @keyframes pulseSpinButton {
          0% { transform: scale(1); box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); }
          50% { transform: scale(1.1); box-shadow: 0 4px 25px rgba(139, 92, 246, 0.7); }
          100% { transform: scale(1); box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Modal Điểm danh */}
      {showCheckInModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            animation: "fadeIn 0.2s ease-out"
          }}
          onClick={() => setShowCheckInModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              width: "420px",
              padding: "30px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              position: "relative",
              textAlign: "center",
              animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              border: "1px solid rgba(226, 232, 240, 0.8)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút đóng */}
            <button
              onClick={() => setShowCheckInModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "20px",
                color: "#94a3b8",
                cursor: "pointer",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#475569"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
            >
              ✕
            </button>

            {/* Icon lớn */}
            <div style={{ fontSize: "50px", marginBottom: "10px" }}>
              🎁
            </div>

            <h3 style={{ fontSize: "1.4rem", fontWeight: "700", color: "#1e293b", margin: "0 0 8px 0" }}>
              Điểm danh nhận xu hàng ngày
            </h3>
            
            <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 24px 0" }}>
              Tích lũy xu mỗi ngày để dùng trừ tiền trực tiếp vào đơn hàng lúc thanh toán!
            </p>

            {/* Grid 7 ngày */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "26px" }}>
              {(() => {
                const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
                const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0, Sunday = 6
                
                return days.map((day, idx) => {
                  const isChecked = idx < todayIndex || (idx === todayIndex && coinsStatus.checkedInToday);
                  const isToday = idx === todayIndex;
                  
                  return (
                    <div
                      key={day}
                      style={{
                        background: isChecked 
                          ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" 
                          : isToday 
                            ? "#fff" 
                            : "#f8fafc",
                        border: isChecked 
                          ? "1.5px solid #fbbf24" 
                          : isToday 
                            ? "1.5px solid var(--primary)" 
                            : "1.5px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "10px 0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        position: "relative",
                        boxShadow: isToday ? "0 4px 6px -1px rgba(99, 102, 241, 0.15)" : "none"
                      }}
                    >
                      <span style={{ fontSize: "11px", fontWeight: "600", color: isChecked ? "#b45309" : isToday ? "var(--primary)" : "#64748b" }}>
                        {day}
                      </span>
                      <span style={{ fontSize: "16px" }}>
                        {isChecked ? "✅" : "🪙"}
                      </span>
                      {isToday && !coinsStatus.checkedInToday && (
                        <span style={{
                          position: "absolute",
                          bottom: "-6px",
                          background: "var(--primary)",
                          color: "#fff",
                          fontSize: "8px",
                          fontWeight: "700",
                          padding: "1px 4px",
                          borderRadius: "4px",
                          whiteSpace: "nowrap"
                        }}>
                          Hôm nay
                        </span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Số dư xu hiện tại */}
            <div style={{
              background: "#f8fafc",
              borderRadius: "16px",
              padding: "12px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
              border: "1px solid #e2e8f0"
            }}>
              <span style={{ color: "#64748b", fontSize: "14px", fontWeight: "500" }}>Số xu hiện có:</span>
              <span style={{ color: "#d97706", fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                🪙 {new Intl.NumberFormat("vi-VN").format(coinsStatus.coins)} xu
              </span>
            </div>

            {/* Nút Điểm danh */}
            <button
              disabled={coinsStatus.checkedInToday}
              onClick={handleCheckIn}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "16px",
                background: coinsStatus.checkedInToday 
                  ? "#e2e8f0" 
                  : "linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)",
                color: coinsStatus.checkedInToday ? "#94a3b8" : "#ffffff",
                border: "none",
                fontWeight: "700",
                fontSize: "16px",
                cursor: coinsStatus.checkedInToday ? "not-allowed" : "pointer",
                boxShadow: coinsStatus.checkedInToday ? "none" : "0 10px 15px -3px rgba(99, 102, 241, 0.3)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if (!coinsStatus.checkedInToday) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 20px -3px rgba(99, 102, 241, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!coinsStatus.checkedInToday) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(99, 102, 241, 0.3)";
                }
              }}
            >
              {coinsStatus.checkedInToday ? "Đã điểm danh hôm nay" : "Điểm danh ngay (Nhận 200 xu)"}
            </button>
          </div>
        </div>
      )}

      {/* Modal Vòng Quay May Mắn */}
      {showSpinModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            animation: "fadeIn 0.2s ease-out"
          }}
          onClick={() => {
            if (!isSpinning) setShowSpinModal(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              width: "440px",
              padding: "26px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              position: "relative",
              textAlign: "center",
              animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút đóng */}
            <button
              disabled={isSpinning}
              onClick={() => setShowSpinModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "20px",
                color: "#94a3b8",
                cursor: isSpinning ? "not-allowed" : "pointer",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => { if (!isSpinning) e.currentTarget.style.color = "#475569"; }}
              onMouseLeave={(e) => { if (!isSpinning) e.currentTarget.style.color = "#94a3b8"; }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: "1.4rem", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              Vòng Quay May Mắn 🎡
            </h3>
            
            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 20px 0", maxWidth: "90%" }}>
              Mỗi lượt quay tốn <strong>100 xu</strong>. Trúng voucher giảm giá hoặc thêm tới 500 xu!
            </p>

            {/* Vòng quay wrapper */}
            <div style={{ position: "relative", width: "290px", height: "290px", marginBottom: "20px" }}>
              {/* Mũi tên chỉ ô trúng thưởng */}
              <div style={{
                position: "absolute",
                top: "-10px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "0",
                height: "0",
                borderLeft: "15px solid transparent",
                borderRight: "15px solid transparent",
                borderTop: "25px solid #ef4444",
                zIndex: 10,
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
              }} />

              {/* Vòng quay Canvas */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  transform: `rotate(${spinAngle}deg)`,
                  transition: spinTransition,
                  borderRadius: "50%",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                }}
              >
                <canvas
                  ref={canvasRef}
                  width="280"
                  height="280"
                  style={{ display: "block", borderRadius: "50%" }}
                />
              </div>

              {/* Nút QUAY trung tâm */}
              <button
                disabled={isSpinning}
                onClick={handleStartSpin}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "66px",
                  height: "66px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  border: "4px solid #ffffff",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: isSpinning ? "not-allowed" : "pointer",
                  zIndex: 5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  letterSpacing: "0.5px"
                }}
              >
                {isSpinning ? "Xoay..." : "QUAY"}
              </button>
            </div>

            {/* Số dư xu hiện tại */}
            <div style={{
              background: "#f8fafc",
              borderRadius: "16px",
              padding: "10px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              marginBottom: "10px",
              border: "1px solid #e2e8f0"
            }}>
              <span style={{ color: "#64748b", fontSize: "14px", fontWeight: "500" }}>Số xu hiện có:</span>
              <span style={{ color: "#d97706", fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                🪙 {new Intl.NumberFormat("vi-VN").format(coinsStatus.coins)} xu
              </span>
            </div>
            
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              *Quà tặng Voucher có thời hạn sử dụng 7 ngày kể từ lúc trúng
            </span>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
