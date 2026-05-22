import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../home/components/Header";
import ProductGrid from "../home/components/ProductGrid";
import { getAuthToken } from "../../utils/authStorage";
import { imageMap, buildBadge } from "../home/utils";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const sortOptions = [
  { label: "Phổ biến", value: "-likeCount" },
  { label: "Mới nhất", value: "-createdAt" },
  { label: "Bán chạy", value: "-soldCount" },
];

const mapProduct = (item) => ({
  id: item._id,
  name: item.name,
  price: item.discountPrice || item.price || 0,
  originalPrice: item.price || 0,
  discountPrice: item.discountPrice || null,
  sortPrice: item.discountPrice || item.price || 0,
  likeCount: item.likeCount || item.likes?.length || 0,
  soldCount: item.soldCount || 0,
  createdAt: item.createdAt || "",
  sold: `Đã bán ${
    item.soldCount >= 1000
      ? (item.soldCount / 1000).toFixed(1) + "k"
      : item.soldCount || 0
  }`,
  badge: buildBadge(item.price, item.discountPrice),
  image: imageMap[item.images?.[0]] || item.images?.[0] || null,
  category: item.categoryId ? {
    id: item.categoryId._id || item.categoryId,
    name: item.categoryId.name || "Danh mục khác"
  } : { id: "other", name: "Danh mục khác" }
});

function ShopPage({ onOpenLogin, onOpenCart, user, onLogout, onChatWithStore }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [activeSort, setActiveSort] = useState("-likeCount");
  const [priceSortValue, setPriceSortValue] = useState("");
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

  const handleSort = (sortField) => {
    setActiveSort(sortField);
    setPriceSortValue("");
  };

  const handlePriceSortChange = (value) => {
    if (!value) return;
    setPriceSortValue(value);
    setActiveSort(value);
  };

  // Extract unique categories from the product list
  const shopCategories = products.reduce((acc, p) => {
    if (p.category && p.category.id) {
      if (!acc.some(cat => cat.id === p.category.id)) {
        acc.push(p.category);
      }
    }
    return acc;
  }, []);

  // Filter products by selected category
  const filteredProducts = selectedCategoryId === "all"
    ? products
    : products.filter(p => p.category?.id === selectedCategoryId);

  // Sort products
  const sortedProducts = [...filteredProducts].sort((first, second) => {
    switch (activeSort) {
      case "-createdAt":
        return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
      case "-soldCount":
        return (second.soldCount || 0) - (first.soldCount || 0);
      case "price":
        return (first.sortPrice || 0) - (second.sortPrice || 0);
      case "-price":
        return (second.sortPrice || 0) - (first.sortPrice || 0);
      case "-likeCount":
      default:
        return (second.likeCount || 0) - (first.likeCount || 0);
    }
  });

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
            <div className="product-shop-section" style={{ marginBottom: "20px" }}>
              <div className="shop-profile-card">
                <div className="shop-avatar-wrapper">
                  <div className="shop-avatar">
                    {shop.avatar ? <img src={shop.avatar} alt={shop.name} /> : <span>{shop.name?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div className="shop-badge">Yêu thích</div>
                </div>
                <div className="shop-info-main">
                  <div className="shop-name">{shop.name}</div>
                  <div className="shop-online-status">
                    <span className={`status-dot ${shop.isOnline ? 'online' : 'offline'}`}></span>
                    {shop.isOnline ? "Online" : (() => {
                      const lastActive = shop.lastActiveAt || shop.updatedAt;
                      if (lastActive) {
                        const minutes = Math.floor((new Date() - new Date(lastActive)) / 60000);
                        if (minutes < 1) return "Vừa hoạt động";
                        if (minutes < 60) return `Hoạt động ${minutes} phút trước`;
                        const hours = Math.floor(minutes / 60);
                        if (hours < 24) return `Hoạt động ${hours} giờ trước`;
                        return `Hoạt động ${Math.floor(hours / 24)} ngày trước`;
                      }
                      return "Offline";
                    })()}
                  </div>
                  <div className="shop-actions">
                    <button 
                      className="shop-view-btn" 
                      onClick={handleFollow}
                      disabled={isSubmittingFollow}
                      style={{ background: isFollowing ? "var(--background-alt)" : "white", color: isFollowing ? "var(--text-secondary)" : "var(--text-main)", border: "1px solid var(--border-color)" }}
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



                    <button 
                      className="shop-view-btn"
                      onClick={() => {
                        if (!user) {
                          alert("Vui lòng đăng nhập để chat với shop.");
                          onOpenLogin();
                          return;
                        }
                        if (shop) {
                          onChatWithStore({
                            id: shop._id || shop.id,
                            ownerId: shop.ownerId,
                            name: shop.name,
                            logo: shop.logo
                          });
                        }
                      }}
                      style={{ background: "white", color: "var(--shopee-red)", border: "1px solid var(--shopee-red)", fontWeight: "600" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "3px" }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      Chat Ngay
                    </button>
                  </div>
                </div>
              </div>

              <div className="shop-stats-grid">
                <div className="shop-stat-item">
                  <span className="stat-label">Đánh Giá</span>
                  <span className="stat-value">{formatCount(shop.totalRatings || 0)}</span>
                </div>
                <div className="shop-stat-item">
                  <span className="stat-label">Tỉ Lệ Phản Hồi</span>
                  <span className="stat-value">{shop.responseRate || "99%"}</span>
                </div>
                <div className="shop-stat-item">
                  <span className="stat-label">Tham Gia</span>
                  <span className="stat-value">
                    {shop.joinedAt ? new Date(shop.joinedAt).toLocaleDateString('vi-VN') : "19/5/2026"}
                  </span>
                </div>
                <div className="shop-stat-item">
                  <span className="stat-label">Sản Phẩm</span>
                  <span className="stat-value">{products.length}</span>
                </div>
                <div className="shop-stat-item">
                  <span className="stat-label">Thời Gian Phản Hồi</span>
                  <span className="stat-value">{shop.responseTime || "trong vài giờ"}</span>
                </div>
                <div className="shop-stat-item">
                  <span className="stat-label">Người Theo Dõi</span>
                  <span className="stat-value">{shop.followerCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Shop Content with Sidebar Filter */}
            <div className="shop-content-layout">
              {/* Sidebar Category Filter */}
              <aside className="shop-sidebar">
                <h3 className="shop-sidebar-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="21" x2="4" y2="14"></line>
                    <line x1="4" y1="10" x2="4" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="3"></line>
                    <line x1="20" y1="21" x2="20" y2="16"></line>
                    <line x1="20" y1="12" x2="20" y2="3"></line>
                    <line x1="1" y1="14" x2="7" y2="14"></line>
                    <line x1="9" y1="8" x2="15" y2="8"></line>
                    <line x1="17" y1="16" x2="23" y2="16"></line>
                  </svg>
                  DANH MỤC CỬA HÀNG
                </h3>
                <ul className="shop-category-list">
                  <li 
                    className={`shop-category-item ${selectedCategoryId === "all" ? "active" : ""}`}
                    onClick={() => setSelectedCategoryId("all")}
                  >
                    <span>Tất cả sản phẩm</span>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>({products.length})</span>
                  </li>
                  {shopCategories.map(cat => {
                    const count = products.filter(p => p.category?.id === cat.id).length;
                    return (
                      <li 
                        key={cat.id} 
                        className={`shop-category-item ${selectedCategoryId === cat.id ? "active" : ""}`}
                        onClick={() => setSelectedCategoryId(cat.id)}
                      >
                        <span>{cat.name}</span>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>({count})</span>
                      </li>
                    );
                  })}
                </ul>
              </aside>

              {/* Product Grid Area */}
              <div className="shop-products-area" style={{ flex: 1 }}>
                {/* Sort Bar */}
                <div className="sort-bar" style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f5f5f5", padding: "13px 20px", borderRadius: "4px", marginBottom: "20px", flexWrap: "wrap" }}>
                  <span style={{ color: "#555", fontSize: "14px", marginRight: "5px" }}>Sắp xếp theo</span>
                  
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSort(option.value)}
                      aria-pressed={activeSort === option.value}
                      style={{
                        padding: "8px 15px",
                        border: "none",
                        borderRadius: "2px",
                        fontSize: "14px",
                        cursor: "pointer",
                        background: activeSort === option.value ? "var(--primary)" : "white",
                        color: activeSort === option.value ? "white" : "#333",
                        fontWeight: "500",
                        boxShadow: "0 1px 1px rgba(0,0,0,0.03)",
                        transition: "all 0.1s ease"
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                  
                  <select 
                    value={priceSortValue} 
                    onChange={(e) => handlePriceSortChange(e.target.value)}
                    style={{
                      padding: "8px 15px",
                      border: "none",
                      borderRadius: "2px",
                      fontSize: "14px",
                      cursor: "pointer",
                      background: (activeSort === "price" || activeSort === "-price") ? "var(--primary)" : "white",
                      color: (activeSort === "price" || activeSort === "-price") ? "white" : "#333",
                      fontWeight: "500",
                      outline: "none",
                      boxShadow: "0 1px 1px rgba(0,0,0,0.03)",
                      transition: "all 0.1s ease"
                    }}
                  >
                    <option value="" style={{ color: "#888", background: "white" }}>Giá</option>
                    <option value="price" style={{ color: "#333", background: "white" }}>Giá: Thấp đến Cao</option>
                    <option value="-price" style={{ color: "#333", background: "white" }}>Giá: Cao đến Thấp</option>
                  </select>
                </div>

                <div style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: "600", color: "var(--text-main)", margin: 0 }}>
                    {selectedCategoryId === "all" ? "Tất cả sản phẩm" : shopCategories.find(c => c.id === selectedCategoryId)?.name || "Danh mục"}
                  </h2>
                  <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Tìm thấy {sortedProducts.length} sản phẩm</span>
                </div>
                {sortedProducts.length > 0 ? (
                  <ProductGrid products={sortedProducts} />
                ) : (
                  <div style={{ textAlign: "center", padding: "40px", background: "#fff", borderRadius: "2px", color: "var(--text-secondary)" }}>
                    Không có sản phẩm nào trong danh mục này.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default ShopPage;
