import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "./components/Header";
import HeroCarousel from "./components/HeroCarousel";
import CategoryList from "./components/CategoryList";
import FlashSale from "./components/FlashSale";
import ProductGrid from "./components/ProductGrid";
import { bannerImages, imageMap, buildBadge } from "./utils";
import { DATA_EVENTS, subscribeDataChanged } from "../../utils/realtimeEvents";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function HomePage({ onOpenLogin, onOpenCart, user, onLogout }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const fetchAll = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);

    try {
      const [catRes, allProductRes] = await Promise.all([
        fetch(`${apiUrl}/categories?limit=100`),
        fetch(`${apiUrl}/products?limit=12&sortBy=-soldCount`),
      ]);

      const catData = await catRes.json();
      const productData = await allProductRes.json();

      if (catRes.ok && Array.isArray(catData.items)) {
        setCategories(catData.items);
      }

      if (allProductRes.ok && Array.isArray(productData.items)) {
        const allMapped = productData.items.map(mapProduct);
        const saleItems = allMapped.filter(
          (item) => item.discountPrice && item.discountPrice < item.originalPrice
        );
        setFlashSaleProducts(saleItems);
        setProducts(allMapped);
      }
    } catch (err) {
      console.error("Loi tai du lieu:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user]); // Re-map when user changes

  const handleLike = async (productId) => {
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
        fetchAll({ showLoading: false });
      }
    } catch (error) {
      console.error("Lỗi khi yêu thích sản phẩm:", error);
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
  }, [user, handleLike]);

  const handleSearch = async (keyword) => {
    if (!keyword.trim()) return;

    try {
      const res = await fetch(
        `${apiUrl}/products?keyword=${encodeURIComponent(keyword)}&limit=12`
      );
      const data = await res.json();

      if (res.ok && Array.isArray(data.items)) {
        setProducts(data.items.map(mapProduct));
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    return subscribeDataChanged((event) => {
      if ([DATA_EVENTS.PRODUCTS, DATA_EVENTS.CATEGORIES].includes(event?.type)) {
        fetchAll({ showLoading: false });
      }
    });
  }, [fetchAll]);

  return (
    <main className="home-page shopee-inspired">
      <Header
        user={user}
        onOpenLogin={onOpenLogin}
        onOpenCart={onOpenCart}
        onLogout={onLogout}
        onSearch={handleSearch}
      />

      <HeroCarousel
        currentSlide={currentSlide}
        setCurrentSlide={setCurrentSlide}
      />

      <section className="content-shell">
        {loading ? (
          <div className="loading-screen">
            <div className="loader"></div>
            <p>Dang tai du lieu...</p>
          </div>
        ) : (
          <>
            <CategoryList categories={categories} />
            <FlashSale products={flashSaleProducts} />
            <ProductGrid products={products} />
          </>
        )}
      </section>
    </main>
  );
}

export default HomePage;
