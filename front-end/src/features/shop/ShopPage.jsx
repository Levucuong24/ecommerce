import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../home/components/Header";
import ProductGrid from "../home/components/ProductGrid";
import { getAuthToken } from "../../utils/authStorage";
import { imageMap, buildBadge } from "../home/utils";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const mapProduct = (item) => ({
  id: item._id,
  name: item.name,
  price: item.discountPrice || item.price || 0,
  originalPrice: item.price || 0,
  discountPrice: item.discountPrice || null,
  sold: `Đã bán ${
    item.soldCount >= 1000
      ? (item.soldCount / 1000).toFixed(1) + "k"
      : item.soldCount || 0
  }`,
  badge: buildBadge(item.price, item.discountPrice),
  image: imageMap[item.images?.[0]] || item.images?.[0] || null,
});

function ShopPage({ onOpenLogin, onOpenCart, user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSubmittingFollow, setIsSubmittingFollow] = useState(false);

  useEffect(() => {
    const fetchShopData = async () => {
      setLoading(true);
      try {
        const [shopRes, productsRes] = await Promise.all([
          fetch(`${apiUrl}/stores/${id}`),
          fetch(`${apiUrl}/stores/${id}/products`)
        ]);

        if (shopRes.ok) {
          const shopData = await shopRes.json();
          setShop(shopData);
          if (user) {
            const userId = user.id || user._id;
            setIsFollowing(shopData.followers?.includes(userId));
          }
        }

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          const items = Array.isArray(productsData.items) ? productsData.items : Array.isArray(productsData) ? productsData : [];
          setProducts(items.map(mapProduct));
        }
      } catch (error) {
        console.error("Lỗi tải thông tin shop:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchShopData();
    }
  }, [id]);

  const handleSearch = (keyword) => {
    navigate(`/home`); // Temporarily navigate to home for global search
  };

  const formatCount = (count) => {
    if (!count) return 0;
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "k";
    }
    return count;
  };

  const handleFollow = async () => {
    if (!user) {
      onOpenLogin();
      return;
    }
    setIsSubmittingFollow(true);
    try {
      const response = await fetch(`${apiUrl}/stores/${id}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        setShop(prev => ({ ...prev, followerCount: data.followerCount }));
      }
    } catch (error) {
      console.error("Lỗi khi theo dõi cửa hàng:", error);
    } finally {
      setIsSubmittingFollow(false);
    }
  };

  return (
    <main className="shop-page shopee-inspired">
      <Header
        user={user}
        onOpenLogin={onOpenLogin}
        onOpenCart={onOpenCart}
        onLogout={onLogout}
        onSearch={handleSearch}
      />

      <section className="content-shell">
        <div 
          className="back-to-home" 
          onClick={() => navigate("/home")}
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "5px", 
            color: "var(--text-secondary)", 
            cursor: "pointer", 
            marginBottom: "15px",
            fontSize: "14px",
            fontWeight: "500",
            transition: "color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Quay lại Trang Chủ
        </div>

        {loading ? (
          <div className="loading-screen">
            <div className="loader"></div>
            <p>Đang tải thông tin shop...</p>
          </div>
        ) : !shop ? (
          <div className="error-screen" style={{ textAlign: "center", padding: "50px 0" }}>
            <h2>Không tìm thấy shop</h2>
            <button className="primary-btn" onClick={() => navigate("/home")} style={{ marginTop: "20px" }}>Quay lại trang chủ</button>
          </div>
        ) : (
          <>
            {/* Shop Profile Header */}
            <div className="shop-profile-header" style={{
                display: "flex", 
                alignItems: "center", 
                background: "var(--surface)", 
                padding: "20px", 
                borderRadius: "var(--radius-md)", 
                boxShadow: "var(--shadow-sm)",
                marginBottom: "20px"
              }}>
              <div className="shop-avatar-wrapper" style={{ marginRight: "20px", position: "relative" }}>
                <div className="shop-avatar" style={{
                  width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--primary-light)",
                  display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f0f0", fontSize: "32px", fontWeight: "bold", color: "var(--text-secondary)"
                }}>
                  {shop.avatar ? <img src={shop.avatar} alt={shop.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{shop.name?.[0]?.toUpperCase()}</span>}
                </div>
              </div>
              <div className="shop-info-main" style={{ flex: 1 }}>
                <h1 className="shop-name" style={{ fontSize: "24px", margin: "0 0 10px 0", color: "var(--text-primary)" }}>{shop.name}</h1>
                <div className="shop-stats" style={{ display: "flex", gap: "20px", color: "var(--text-secondary)", fontSize: "14px" }}>
                  <span><strong style={{ color: "var(--primary)" }}>{products.length}</strong> Sản phẩm</span>
                  <span><strong style={{ color: "var(--primary)" }}>{formatCount(shop.totalRatings || 0)}</strong> Đánh giá</span>
                  <span><strong style={{ color: "var(--primary)" }}>{shop.responseRate || '99%'}</strong> Tỉ lệ phản hồi</span>
                </div>
              </div>
              <div className="shop-actions">
                <button 
                  className="shop-view-btn" 
                  style={{ marginRight: "10px", display: "inline-flex", alignItems: "center", gap: "5px", background: isFollowing ? "var(--background-alt)" : "var(--primary)", color: isFollowing ? "var(--text-secondary)" : "white", border: isFollowing ? "1px solid var(--border-color)" : "none" }}
                  onClick={handleFollow}
                  disabled={isSubmittingFollow}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isFollowing ? (
                      <path d="M20 6L9 17l-5-5"></path>
                    ) : (
                      <>
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </>
                    )}
                  </svg>
                  {isFollowing ? "Đang Theo Dõi" : "Theo Dõi"}
                </button>
                <button className="shop-chat-btn primary-btn" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Chat Ngay
                </button>
              </div>
            </div>

            {/* Shop Products */}
            <div className="shop-products">
              <ProductGrid products={products} />
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default ShopPage;
