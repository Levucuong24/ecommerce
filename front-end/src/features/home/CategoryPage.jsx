import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import ProductGrid from "./components/ProductGrid";
import { imageMap, buildBadge } from "./utils";

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

function CategoryPage({ user, onLogout, onOpenLogin, onOpenCart }) {
  const { categorySlug } = useParams();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);

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
  }, [categorySlug]);

  useEffect(() => {
    fetchCategoryProducts();
  }, [fetchCategoryProducts]);

  return (
    <main className="home-page shopee-inspired">
      <Header
        user={user}
        onOpenLogin={onOpenLogin}
        onOpenCart={onOpenCart}
        onLogout={onLogout}
      />

      <div className="admin-banner" style={{ marginBottom: '30px' }}>
        <div className="admin-banner-content animate-fade">
          <h1>{categoryName || "Danh mục"}</h1>
          <p>Khám phá các sản phẩm thuộc danh mục {categoryName}</p>
        </div>
      </div>

      <section className="content-shell" style={{ paddingTop: '0' }}>
        {loading ? (
          <div className="loading-screen">
            <div className="loader"></div>
            <p>Đang tải sản phẩm...</p>
          </div>
        ) : (
          <div className="product-panel">
            <div className="section-heading">
              <h2>Tất cả sản phẩm</h2>
              <span>{products.length} sản phẩm</span>
            </div>
            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <div className="empty-state" style={{ padding: '60px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📦</div>
                <p>Chưa có sản phẩm nào trong danh mục này.</p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default CategoryPage;
