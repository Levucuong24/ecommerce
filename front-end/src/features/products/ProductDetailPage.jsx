import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../home/components/Header";

import { imageMap, formatPrice } from "../home/utils";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function ProductDetailPage({ onOpenLogin, onOpenCart, user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${apiUrl}/products/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch product");
        }

        setProduct(data);
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleSearch = (keyword) => {
    navigate(`/home`);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="error-screen">
        <h2>Không tìm thấy sản phẩm</h2>
        <button onClick={() => navigate("/home")}>Quay lại trang chủ</button>
      </div>
    );
  }

  const formatCount = (count) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "k";
    }
    return count;
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
      <span className="rating-stars">
        {"★".repeat(fullStars)}
        {halfStar ? "½" : ""}
        {"☆".repeat(emptyStars)}
      </span>
    );
  };

  const nextImage = () => {
    if (!product?.images?.length) return;
    setCurrentImageIdx((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    if (!product?.images?.length) return;
    setCurrentImageIdx((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const getImageUrl = (img) => {
    if (!img) return "/images/iphone15pro.png";
    return imageMap[img] || img;
  };

  const currentImageUrl = getImageUrl(product?.images?.[currentImageIdx]);
  const variantImageUrl = getImageUrl(product?.images?.[0]);

  return (
    <main className="product-detail-page shopee-inspired">
      {/* ... Header ... */}
      <Header
        user={user}
        onOpenLogin={onOpenLogin}
        onOpenCart={onOpenCart}
        onLogout={onLogout}
        onSearch={handleSearch}
      />

      <section className="content-shell product-detail-container">
        <div className="product-detail-card">
          <div className="product-detail-visuals">
            <div className="main-image-wrapper">
              <img src={currentImageUrl} alt={product.name} className="main-product-image" />
            </div>
            <div className="image-navigation">
              <button className="nav-btn prev" onClick={prevImage}>{"<"}</button>
              <div className="image-thumbnails">
                {(product.images?.length > 0 ? product.images : [null, null, null, null, null]).map((img, idx) => (
                  <div 
                    key={idx} 
                    className={`thumbnail ${idx === currentImageIdx ? 'active' : ''}`}
                    onClick={() => setCurrentImageIdx(idx)}
                    onMouseEnter={() => setCurrentImageIdx(idx)}
                  >
                    <img src={getImageUrl(img)} alt={`${product.name} ${idx}`} />
                  </div>
                ))}
              </div>
              <button className="nav-btn next" onClick={nextImage}>{">"}</button>
            </div>
            <div className="social-share-row">
              <div className="share-links">
                <span>Chia sẻ:</span>
                <span className="share-icon messenger"></span>
                <span className="share-icon facebook"></span>
                <span className="share-icon pinterest"></span>
                <span className="share-icon twitter"></span>
              </div>
              <div className="like-count">
                <span className="heart-icon">❤️</span>
                <span>Đã thích ({formatCount(product.likes || 0)})</span>
              </div>
            </div>
          </div>

          <div className="product-detail-info">
            <h1 className="product-title">
              <span className="favorite-badge">Yêu thích</span>
              {product.name}
            </h1>
            
            <div className="product-rating-row">
              <div className="rating-block">
                <span className="rating-value">{product.ratingAverage || 0}</span>
                {renderStars(product.ratingAverage || 0)}
              </div>
              <div className="review-block">
                <span className="count-value">{formatCount(product.ratingCount || 0)}</span>
                <span className="count-label">Đánh Giá</span>
              </div>
              <div className="sold-block">
                <span className="count-value">{formatCount(product.soldCount || 0)}</span>
                <span className="count-label">Đã Bán</span>
              </div>
              <button className="report-btn">Tố cáo</button>
            </div>

            <div className="product-price-panel">
              <div className="price-display">
                {product.discountPrice ? (
                  <>
                    <span className="original-price">{formatPrice(product.price)}₫</span>
                    <span className="current-price">
                      {formatPrice(product.discountPrice)}₫ - {formatPrice(product.discountPrice * 1.1)}₫
                    </span>
                    <span className="discount-tag">{Math.round((1 - product.discountPrice / product.price) * 100)}% GIẢM</span>
                  </>
                ) : (
                  <span className="current-price">{formatPrice(product.price)}₫</span>
                )}
              </div>
            </div>

            <div className="product-promotions">
              <div className="promo-row">
                <span className="promo-label">Mã Giảm Giá Của Shop</span>
                <div className="promo-tags">
                  <span className="shop-voucher">Giảm 17%</span>
                </div>
              </div>

              <div className="promo-row">
                <span className="promo-label">Vận Chuyển</span>
                <div className="shipping-info">
                  <div className="shipping-line">
                    <span className="ship-icon">🚚</span>
                    <span>Vận Chuyển Tới: <strong>Quận Hoàn Kiếm, Hà Nội</strong></span>
                  </div>
                  <div className="shipping-line">
                    <span className="ship-fee-icon"></span>
                    <span>Phí Vận Chuyển: <strong>0₫</strong></span>
                  </div>
                </div>
              </div>

              <div className="promo-row">
                <span className="promo-label">An Tâm Mua Sắm Cùng Shopee</span>
                <div className="guarantee-info">
                  <span className="checkmark-icon">🛡️</span>
                  <span>Trả hàng miễn phí 15 ngày • Bảo hiểm bảo vệ người tiêu dùng</span>
                </div>
              </div>

              <div className="promo-row">
                <span className="promo-label">Màu Sắc</span>
                <div className="variant-options">
                  {["Đèn xoay nước", "Đèn phía Bắc", "gợn nước"].map((variant, idx) => (
                    <button key={idx} className="variant-btn">
                      <img src={variantImageUrl} alt={variant} />
                      {variant}
                    </button>
                  ))}
                </div>
              </div>

              <div className="promo-row">
                <span className="promo-label">Số Lượng</span>
                <div className="quantity-control-wrapper">
                  <div className="quantity-selector">
                    <button className="qty-btn">-</button>
                    <input type="text" value="1" readOnly className="qty-input" />
                    <button className="qty-btn">+</button>
                  </div>
                  <span className="stock-hint">{product.stock} sản phẩm có sẵn</span>
                </div>
              </div>
            </div>

            <div className="product-actions">
              <button className="add-to-cart-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                Thêm Vào Giỏ Hàng
              </button>
              <button className="buy-now-btn">Mua Ngay</button>
            </div>
          </div>
        </div>

        {product.shop && (
          <div className="product-shop-section">
            <div className="shop-profile-card">
              <div className="shop-avatar-wrapper">
                <div className="shop-avatar">
                  {product.shop.avatar ? <img src={product.shop.avatar} alt={product.shop.name} /> : <span>{product.shop.name?.[0]}</span>}
                </div>
                <div className="shop-badge">Yêu thích</div>
              </div>
              <div className="shop-info-main">
                <div className="shop-name">{product.shop.name}</div>
                <div className="shop-online-status">Online 22 phút trước</div>
                <div className="shop-actions">
                  <button className="shop-chat-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Chat Ngay
                  </button>
                  <button className="shop-view-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    Xem Shop
                  </button>
                </div>
              </div>
            </div>

            <div className="shop-stats-grid">
              <div className="shop-stat-item">
                <span className="stat-label">Đánh Giá</span>
                <span className="stat-value">{formatCount(product.shop.totalRatings)}</span>
              </div>
              <div className="shop-stat-item">
                <span className="stat-label">Tỉ Lệ Phản Hồi</span>
                <span className="stat-value">{product.shop.responseRate}</span>
              </div>
              <div className="shop-stat-item">
                <span className="stat-label">Tham Gia</span>
                <span className="stat-value">
                  {product.shop.joinedAt ? new Date(product.shop.joinedAt).toLocaleDateString('vi-VN') : "Vừa mới"}
                </span>
              </div>
              <div className="shop-stat-item">
                <span className="stat-label">Sản Phẩm</span>
                <span className="stat-value">{product.shop.totalProducts}</span>
              </div>
              <div className="shop-stat-item">
                <span className="stat-label">Thời Gian Phản Hồi</span>
                <span className="stat-value">{product.shop.responseTime}</span>
              </div>
              <div className="shop-stat-item">
                <span className="stat-label">Người Theo Dõi</span>
                <span className="stat-value">{product.shop.followerCount}</span>
              </div>
            </div>
          </div>
        )}

        <div className="product-description-panel">
          <h3>CHI TIẾT SẢN PHẨM</h3>
          <div className="spec-table">
            <div className="spec-table-row">
              <span className="spec-table-label">Danh Mục</span>
              <span className="spec-table-value">Shopee {">"} Thiết Bị Điện Gia Dụng {">"} Đèn {">"} Đèn Ngủ</span>
            </div>
            <div className="spec-table-row">
              <span className="spec-table-label">Thương hiệu</span>
              <span className="spec-table-value">No Brand</span>
            </div>
          </div>

          <h3 style={{ marginTop: '30px' }}>MÔ TẢ SẢN PHẨM</h3>
          <div className="description-content">
            {product.description || "Chưa có mô tả cho sản phẩm này."}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ProductDetailPage;
