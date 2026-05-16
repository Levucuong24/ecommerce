import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../home/components/Header";
import ProductGrid from "../home/components/ProductGrid";
import { getAuthToken } from "../../utils/authStorage";
import { imageMap, buildBadge } from "../home/utils";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function LikedProductsPage({ user, onLogout, onOpenLogin, onOpenCart }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLikedProducts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/products/liked`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.items.map(mapProduct));
      }
    } catch (error) {
      console.error("Lỗi khi tải sản phẩm yêu thích:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleLike = async (productId) => {
    try {
      const response = await fetch(`${apiUrl}/products/${productId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        fetchLikedProducts();
      }
    } catch (error) {
      console.error("Lỗi khi hủy yêu thích:", error);
    }
  };

  const mapProduct = useCallback((item) => {
    const userId = user?.id || user?._id;
    return {
      id: item._id,
      name: item.name,
      price: item.discountPrice || item.price || 0,
      originalPrice: item.price || 0,
      discountPrice: item.discountPrice || null,
      sold: `Đã bán ${item.soldCount || 0}`,
      badge: buildBadge(item.price, item.discountPrice),
      image: imageMap[item.images?.[0]] || item.images?.[0] || null,
      categoryName: item.categoryId?.name || "Khác",
      isLiked: item.likes?.includes(userId),
      onLike: handleLike,
    };
  }, [user, handleLike]);

  useEffect(() => {
    fetchLikedProducts();
  }, [fetchLikedProducts]);

  return (
    <div className="liked-products-page shopee-inspired">
      <Header
        user={user}
        onOpenLogin={onOpenLogin}
        onOpenCart={onOpenCart}
        onLogout={onLogout}
        onSearch={() => navigate("/home")}
      />
      <main className="content-shell following-shops-content">
        <div 
          className="back-to-home" 
          onClick={() => navigate("/home")}
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "5px", 
            color: "var(--text-secondary)", 
            cursor: "pointer", 
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Quay lại Trang Chủ
        </div>
        
        <h2>Sản Phẩm Yêu Thích</h2>

        {!user ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "15px" }}>Vui lòng đăng nhập để xem danh sách</p>
            <button className="primary-btn" onClick={onOpenLogin}>Đăng Nhập</button>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>Đang tải...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", background: "var(--surface)", borderRadius: "8px" }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>❤️</div>
            <p style={{ color: "var(--text-secondary)" }}>Bạn chưa yêu thích sản phẩm nào.</p>
            <button className="primary-btn" style={{ marginTop: "15px" }} onClick={() => navigate("/home")}>Khám phá ngay</button>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </main>
    </div>
  );
}

export default LikedProductsPage;
