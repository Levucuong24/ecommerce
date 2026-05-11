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

function HomePage({ onOpenLogin, onOpenCart }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(fallbackCategories);
  const [products, setProducts] = useState(fallbackProducts);
  const [user, setUser] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/home");
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Invalid user data in local storage");
      }
    }

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

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${apiUrl}/products?limit=6`);
        const data = await response.json();

        if (!response.ok || !Array.isArray(data.items) || data.items.length === 0) {
          return;
        }

        setProducts(
          data.items.map((item) => ({
            name: item.name,
            price: item.discountPrice || item.price || 0,
            sold: `Ton kho ${item.stock ?? 0}`,
            badge: buildBadge(item.price, item.discountPrice),
            image: imageMap[item.images?.[0]] || iphone15Pro,
          }))
        );
      } catch (error) {
        // Keep fallback products when backend is unavailable.
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
        onLogout={handleLogout}
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
