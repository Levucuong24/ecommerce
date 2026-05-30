import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "./components/Header";
import HeroCarousel from "./components/HeroCarousel";
import CategoryList from "./components/CategoryList";
import FlashSale from "./components/FlashSale";
import ProductGrid from "./components/ProductGrid";
import Footer from "./components/Footer";
import { bannerImages, imageMap, buildBadge } from "./utils";
import { DATA_EVENTS, subscribeDataChanged } from "../../utils/realtimeEvents";
import { getAuthToken } from "../../utils/authStorage";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const assetBaseUrl = apiUrl.replace(/\/api\/?$/, "");

const getItems = (data) => {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
};

const resolveProductImage = (images = []) => {
  const image = images.find(Boolean);
  if (!image) return null;
  if (imageMap[image]) return imageMap[image];
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("/")) return image;
  return `${assetBaseUrl}/uploads/${image}`;
};

function HomePage({ onOpenLogin, onOpenCart, user, onLogout }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const fetchAll = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);

    try {
      const [catRes, allProductRes, flashProductRes, bannerRes] = await Promise.all([
        fetch(`${apiUrl}/categories?limit=100`),
        fetch(`${apiUrl}/products?limit=12&sortBy=-soldCount`),
        fetch(`${apiUrl}/products?isFlashSale=true&limit=10`),
        fetch(`${apiUrl}/banners?active=true&sortBy=order`),
      ]);

      const catData = await catRes.json();
      const productData = await allProductRes.json();
      const flashData = await flashProductRes.json();

      if (catRes.ok && Array.isArray(catData.items)) {
        setCategories(catData.items);
      }

      if (allProductRes.ok) {
        const allMapped = getItems(productData).map(mapProduct);
        setProducts(allMapped);
      }

      if (flashProductRes.ok) {
        const flashMapped = getItems(flashData).map(mapProduct);
        const now = new Date();
        const saleItems = flashMapped.filter((item) => {
          if (!item.isFlashSale) return false;
          if (item.flashSaleStartTime && new Date(item.flashSaleStartTime) > now) return false;
          if (item.flashSaleEndTime && new Date(item.flashSaleEndTime) < now) return false;
          return item.discountPrice && item.discountPrice < item.originalPrice;
        });
        setFlashSaleProducts(saleItems);
      }

      if (bannerRes.ok) {
        const bannerData = await bannerRes.json();
        if (Array.isArray(bannerData.items) && bannerData.items.length > 0) {
          setBanners(bannerData.items.map(b => b.image));
        } else {
          setBanners(bannerImages);
        }
      } else {
        setBanners(bannerImages);
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

  const handleVoucherClick = () => {
    if (!user) {
      alert("Vui lòng đăng nhập để xem kho voucher.");
      onOpenLogin();
      return;
    }
    navigate('/vouchers');
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
      image: resolveProductImage(item.images),
      categoryName: item.categoryId?.name || "Khác",
      isLiked: item.likes?.some((likeId) => String(likeId) === String(userId)),
      onLike: handleLike,
      isFlashSale: item.isFlashSale,
      flashSaleStartTime: item.flashSaleStartTime,
      flashSaleEndTime: item.flashSaleEndTime,
    };
  }, [user, handleLike]);

  const handleSearch = async (keyword) => {
    if (!keyword.trim()) return;

    try {
      const res = await fetch(
        `${apiUrl}/products?keyword=${encodeURIComponent(keyword)}&limit=12`
      );
      const data = await res.json();

      if (res.ok) {
        setProducts(getItems(data).map(mapProduct));
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
        onVoucherClick={handleVoucherClick}
        banners={banners}
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

      <Footer />
    </main>
  );
}

export default HomePage;
