import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import iphone15Pro from "../../assets/images/iphone15pro.png";
import Header from "./components/Header";
import HeroCarousel from "./components/HeroCarousel";
import CategoryList from "./components/CategoryList";
import FlashSale from "./components/FlashSale";
import ProductGrid from "./components/ProductGrid";
import {
  bannerImages,
  fallbackCategories,
  fallbackProducts,
  imageMap,
  buildBadge,
} from "./utils";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function HomePage({ onOpenLogin, onOpenCart, user, onLogout }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(fallbackCategories);
  const [products, setProducts] = useState(fallbackProducts);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (keyword) => {
    fetchProducts(keyword);
  };

  const fetchProducts = async (keyword = "") => {
    try {
      let url = `${apiUrl}/products?limit=6`;
      if (keyword) {
        url += `&keyword=${encodeURIComponent(keyword)}`;
      }
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !Array.isArray(data.items) || data.items.length === 0) {
        return;
      }

      setProducts(
        data.items.map((item) => ({
          id: item._id,
          name: item.name,
          price: item.discountPrice || item.price || 0,
          sold: `Đã bán ${item.soldCount >= 1000 ? (item.soldCount / 1000).toFixed(1) + 'k' : item.soldCount}`,
          badge: buildBadge(item.price, item.discountPrice),
          image: imageMap[item.images?.[0]] || iphone15Pro,
        }))
      );
    } catch (error) {
      // Keep fallback products when backend is unavailable.
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${apiUrl}/categories?limit=8`);
        const data = await response.json();

        if (!response.ok || !Array.isArray(data.items) || data.items.length === 0) {
          return;
        }

        setCategories(data.items.map((item) => item.name));
      } catch (error) {
        // Keep fallback categories when backend is unavailable.
      }
    };

    fetchCategories();
    fetchProducts();
  }, []);

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
        <CategoryList categories={categories} />
        <FlashSale products={products} />
        <ProductGrid products={products} />
      </section>
    </main>
  );
}

export default HomePage;
