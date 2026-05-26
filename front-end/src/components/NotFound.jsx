import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#334155" }}>
      <h1 style={{ fontSize: "72px", margin: "0", color: "#ee4d2d", fontWeight: "bold" }}>404</h1>
      <p style={{ fontSize: "20px", marginBottom: "30px", fontWeight: "500", textAlign: "center" }}>this is not the web page you are looking for</p>
      <button onClick={() => navigate("/home")} style={{ padding: "12px 24px", background: "#ee4d2d", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px", fontWeight: "600", transition: "opacity 0.2s" }} onMouseEnter={(e) => e.target.style.opacity = "0.9"} onMouseLeave={(e) => e.target.style.opacity = "1"}>
        Quay lại trang chủ
      </button>
    </div>
  );
}

export default NotFound;
