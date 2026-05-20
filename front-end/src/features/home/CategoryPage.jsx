import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "./components/Header";
import ProductGrid from "./components/ProductGrid";
import { imageMap, buildBadge } from "./utils";
import { getAuthToken } from "../../utils/authStorage";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const DEFAULT_SORT = "-likeCount";

const sortOptions = [
  { label: "Phổ biến", value: "-likeCount" },
  { label: "Mới nhất", value: "-createdAt" },
  { label: "Bán chạy", value: "-soldCount" },
];

const ratingFilterOptions = [
  { label: "Tất cả đánh giá", value: 0 },
  { label: "★★★★★", value: 5 },
  { label: "★★★★☆ trở lên", value: 4 },
  { label: "★★★☆☆ trở lên", value: 3 },
  { label: "★★☆☆☆ trở lên", value: 2 },
  { label: "★☆☆☆☆ trở lên", value: 1 },
];

function CategoryPage({ user, onLogout, onOpenLogin, onOpenCart }) {
  const { categorySlug } = useParams();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState(DEFAULT_SORT);
  const [priceSortValue, setPriceSortValue] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [showSpinner, setShowSpinner] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const userId = user?.id || user?._id;

  const handleSort = (sortField) => {
    setActiveSort(sortField);
    setPriceSortValue("");
  };

  const handlePriceSortChange = (value) => {
    if (!value) return;
    setPriceSortValue(value);
    setActiveSort(value);
  };

  const handleLike = useCallback(async (productId) => {
    if (!user) {
      onOpenLogin();
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/products/${productId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        setRefreshKey((current) => current + 1);
      }
    } catch (error) {
      console.error("Lỗi khi yêu thích sản phẩm:", error);
    }
  }, [onOpenLogin, user]);

  const mapProduct = useCallback((item) => {
    return {
      id: item._id,
      name: item.name,
      price: item.discountPrice || item.price || 0,
      originalPrice: item.price || 0,
      discountPrice: item.discountPrice || null,
      sortPrice: item.discountPrice || item.price || 0,
      likeCount: item.likeCount || item.likes?.length || 0,
      ratingAverage: item.ratingAverage || 0,
      soldCount: item.soldCount || 0,
      createdAt: item.createdAt || "",
      sold: `Đã bán ${
        item.soldCount >= 1000
          ? (item.soldCount / 1000).toFixed(1) + "k"
          : item.soldCount || 0
      }`,
      badge: buildBadge(item.price, item.discountPrice),
      image: imageMap[item.images?.[0]] || item.images?.[0] || null,
      categoryName: item.categoryId?.name || "Khác",
      isLiked: item.likes?.includes(userId),
      onLike: handleLike,
    };
  }, [handleLike, userId]);

  const fetchCategoryProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Extract ID from slug (it's the last part after the last hyphen)
      const parts = categorySlug.split("-");
      const categoryId = parts[parts.length - 1];
      
      const [prodRes, catRes] = await Promise.all([
        fetch(`${apiUrl}/products?categoryId=${categoryId}&limit=50`),
        fetch(`${apiUrl}/categories/${categoryId}`)
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.items.map(mapProduct));
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategoryName(catData.name);
      }
    } catch (err) {
      console.error("Lỗi tải sản phẩm danh mục:", err);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, mapProduct, refreshKey]);

  const filteredProducts = useMemo(() => {
    if (!ratingFilter) return products;

    return products.filter((product) => {
      if (ratingFilter === 5) {
        return (product.ratingAverage || 0) >= 5;
      }

      return (product.ratingAverage || 0) >= ratingFilter;
    });
  }, [products, ratingFilter]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];

    sorted.sort((first, second) => {
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

    return sorted;
  }, [activeSort, filteredProducts]);

  useEffect(() => {
    setActiveSort(DEFAULT_SORT);
    setPriceSortValue("");
    setRatingFilter(0);
  }, [categorySlug]);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setShowSpinner(true);
        setProducts([]);
      }, 200);
    } else {
      setShowSpinner(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    fetchCategoryProducts();
  }, [fetchCategoryProducts]);

  return (
    <main className="category-page shopee-inspired">
      <Header
        user={user}
        onOpenLogin={onOpenLogin}
        onOpenCart={onOpenCart}
        onLogout={onLogout}
      />

      <div className="category-banner">
        <div className="category-banner-content animate-fade">
          <h1>{categoryName || "Danh mục"}</h1>
          <p>Khám phá các sản phẩm thuộc danh mục {categoryName}</p>
        </div>
      </div>

      <section className="content-shell" style={{ paddingTop: '0' }}>
        <div className="product-panel" style={{ opacity: loading ? 0.7 : 1, transition: "opacity 0.15s ease" }}>
          <div className="section-heading">
            <h2>Tất cả sản phẩm</h2>
            <span>{sortedProducts.length} sản phẩm</span>
          </div>

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

          <div className="rating-filter-bar" style={{ display: "flex", alignItems: "center", gap: "12px", background: "#fff", padding: "0 0 18px", marginBottom: "2px", flexWrap: "wrap" }}>
            <label htmlFor="rating-filter" style={{ color: "#555", fontSize: "14px", fontWeight: "500" }}>
              Đánh Giá
            </label>
            <select
              id="rating-filter"
              value={ratingFilter}
              onChange={(event) => setRatingFilter(Number(event.target.value))}
              style={{
                minWidth: "190px",
                padding: "9px 14px",
                border: "1px solid #e5e7eb",
                borderRadius: "3px",
                fontSize: "14px",
                cursor: "pointer",
                background: "white",
                color: ratingFilter ? "var(--primary)" : "#333",
                fontWeight: "500",
                outline: "none",
                boxShadow: "0 1px 1px rgba(0,0,0,0.03)"
              }}
            >
              {ratingFilterOptions.map((option) => (
                <option key={option.value} value={option.value} style={{ color: "#333", background: "white" }}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {showSpinner ? (
            <>
              <style>{`
                .skeleton {
                  animation: skeleton-pulse 1.5s infinite ease-in-out;
                }
                @keyframes skeleton-pulse {
                  0% { opacity: 0.6; }
                  50% { opacity: 1; }
                  100% { opacity: 0.6; }
                }
              `}</style>
              <div className="product-grid" style={{ pointerEvents: "none" }}>
                {Array.from({ length: 8 }).map((_, idx) => (
                  <ProductCardSkeleton key={idx} />
                ))}
              </div>
            </>
          ) : (loading && products.length === 0) ? (
            <div style={{ height: "300px" }} />
          ) : sortedProducts.length > 0 ? (
            <div className="animate-fade">
              <ProductGrid products={sortedProducts} />
            </div>
          ) : (
            <div className="empty-state animate-fade" style={{ padding: '60px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📦</div>
              <p>Chưa có sản phẩm nào trong danh mục này.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="product-card skeleton" style={{ cursor: "default", border: "1px solid var(--border)", background: "var(--bg-card)" }}>
      <div className="product-thumb" style={{ background: "#e2e8f0", margin: "12px", height: "240px", borderRadius: "18px" }} />
      <div className="product-body" style={{ padding: "0 18px 18px" }}>
        <div style={{ height: "16px", background: "#e2e8f0", borderRadius: "4px", width: "100%", marginBottom: "8px" }} />
        <div style={{ height: "16px", background: "#e2e8f0", borderRadius: "4px", width: "60%", marginBottom: "15px" }} />
        <div style={{ height: "24px", background: "#e2e8f0", borderRadius: "4px", width: "40%", marginTop: "auto" }} />
        <div className="product-meta" style={{ marginTop: "10px" }}>
          <div style={{ height: "14px", background: "#e2e8f0", borderRadius: "4px", width: "30%" }} />
        </div>
      </div>
    </div>
  );
}

export default CategoryPage;
