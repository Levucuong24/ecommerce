import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../home/components/Header";
import { getAuthToken } from "../../utils/authStorage";
import { imageMap, formatPrice } from "../home/utils";
import { DATA_EVENTS, subscribeDataChanged } from "../../utils/realtimeEvents";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function ProductDetailPage({ onOpenLogin, onOpenCart, user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewImages, setReviewImages] = useState([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [isFollowingStore, setIsFollowingStore] = useState(false);
  const [isSubmittingFollow, setIsSubmittingFollow] = useState(false);
  const [shopOnlineStatus, setShopOnlineStatus] = useState("");

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${apiUrl}/reviews?productId=${id}`);
      const data = await response.json();
      if (response.ok) {
        setReviews(data.items || data || []);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${apiUrl}/products/${id}?t=${Date.now()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch product");
        }

        setProduct(data);
        if (data.shop && user) {
          const userId = user.id || user._id;
          setIsFollowingStore(data.shop.followers?.includes(userId));
        }

        // Calculate shop status on client to avoid hydration mismatch
        if (data.shop) {
          if (data.shop.isOnline) {
            setShopOnlineStatus("Online");
          } else {
            const lastActive = data.shop.lastActive || data.shop.createdAt;
            if (!lastActive) {
              setShopOnlineStatus("Online vừa mới");
            } else {
              const lastActiveDate = new Date(lastActive);
              const diff = Math.floor((new Date() - lastActiveDate) / 60000);
              if (diff < 1) setShopOnlineStatus("Online vừa mới");
              else if (diff < 60) setShopOnlineStatus(`Online ${diff} phút trước`);
              else if (diff < 1440) setShopOnlineStatus(`Online ${Math.floor(diff / 60)} giờ trước`);
              else setShopOnlineStatus(`Online ${Math.floor(diff / 1440)} ngày trước`);
            }
          }
        }
        fetchReviews();
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    // Polling for real-time status updates (like shop online status)
    const interval = setInterval(fetchProduct, 10000);

    // Immediate update when receiving an event from another tab
    const unsubscribe = subscribeDataChanged((event) => {
      if (event?.type === DATA_EVENTS.STORES) {
        fetchProduct();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setReviewMessage("Vui lòng đăng nhập để đánh giá.");
      return;
    }
    setIsSubmittingReview(true);
    setReviewMessage("");
    try {
      const formData = new FormData();
      formData.append("productId", id);
      formData.append("rating", reviewForm.rating);
      formData.append("comment", reviewForm.comment);
      reviewImages.forEach((img) => formData.append("images", img));

      const response = await fetch(`${apiUrl}/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });

      if (response.ok) {
        setReviewForm({ rating: 5, comment: "" });
        setReviewImages([]);
        setReviewMessage("Đánh giá thành công!");
        fetchReviews();
        // Also refresh product to update rating count/average
        const prodRes = await fetch(`${apiUrl}/products/${id}`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProduct(prodData);
        }
      } else {
        const data = await response.json();
        setReviewMessage(data.message || "Đã xảy ra lỗi.");
      }
    } catch (error) {
      setReviewMessage("Không thể kết nối đến máy chủ.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleFollowShop = async () => {
    if (!product || !product.shop) return;
    if (!user) {
      onOpenLogin();
      return;
    }
    setIsSubmittingFollow(true);
    try {
      const response = await fetch(`${apiUrl}/stores/${product.shop._id || product.storeId}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIsFollowingStore(data.isFollowing);
        setProduct(prev => ({
          ...prev,
          shop: {
            ...prev.shop,
            followerCount: data.followerCount,
            followers: data.isFollowing ? [...(prev.shop.followers || []), user.id || user._id] : (prev.shop.followers || []).filter(id => id !== (user.id || user._id))
          }
        }));
      }
    } catch (error) {
      console.error("Lỗi khi theo dõi cửa hàng:", error);
    } finally {
      setIsSubmittingFollow(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      onOpenLogin();
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/products/${id}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const userId = user.id || user._id;
        setProduct((prev) => ({
          ...prev,
          likes: data.isLiked 
            ? [...(prev.likes || []), userId] 
            : (prev.likes || []).filter(uid => uid !== userId),
          likeCount: data.likeCount
        }));
      }
    } catch (error) {
      console.error("Lỗi khi yêu thích sản phẩm:", error);
    }
  };

  const handleAddToCart = async (isBuyNow = false) => {
    if (!user) {
      onOpenLogin();
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          productId: id,
          quantity: quantity
        }),
      });
      if (response.ok) {
        if (isBuyNow) {
          onOpenCart();
        } else {
          // Success notification
          alert("Sản phẩm đã được thêm vào giỏ hàng!");
          // Trigger header update
          emitDataChanged({ type: DATA_EVENTS.PRODUCTS }); // Reuse product event or create new CART event
        }
      }
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
    }
  };

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
                    key={`${product._id}-thumb-${idx}`} 
                    role="button"
                    tabIndex={0}
                    className={`thumbnail ${idx === currentImageIdx ? 'active' : ''}`}
                    onClick={() => setCurrentImageIdx(idx)}
                    onMouseEnter={() => setCurrentImageIdx(idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setCurrentImageIdx(idx);
                      }
                    }}
                  >
                    <img src={getImageUrl(img)} alt={`${product.name} thumbnail ${idx + 1}`} />
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
              <div 
                className={`like-count ${product.likes?.includes(user?.id || user?._id) ? 'active' : ''}`}
                onClick={handleLike}
                style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
              >
                <span className="heart-icon">{product.likes?.includes(user?.id || user?._id) ? '❤️' : '🤍'}</span>
                <span>Đã thích ({formatCount(product.likes?.length || product.likeCount || 0)})</span>
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
                <span className="promo-label">An Tâm Mua Sắm Cùng Ecommerce</span>
                <div className="guarantee-info">
                  <span className="checkmark-icon">🛡️</span>
                  <span>Trả hàng miễn phí 15 ngày • Bảo hiểm bảo vệ người tiêu dùng</span>
                </div>
              </div>

              <div className="promo-row">
                <span className="promo-label">Màu Sắc</span>
                <div className="variant-options">
                  {["Đèn xoay nước", "Đèn phía Bắc", "gợn nước"].map((variant, idx) => (
                    <button key={`${product._id}-variant-${idx}`} className="variant-btn">
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
                    <button className="qty-btn" onClick={() => setQuantity(prev => Math.max(1, prev - 1))}>-</button>
                    <input type="text" value={quantity} readOnly className="qty-input" />
                    <button className="qty-btn" onClick={() => setQuantity(prev => Math.min(product.stock || 99, prev + 1))}>+</button>
                  </div>
                  <span className="stock-hint">{product.stock} sản phẩm có sẵn</span>
                </div>
              </div>
            </div>

            <div className="product-actions">
              <button className="add-to-cart-btn" onClick={() => handleAddToCart(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                Thêm Vào Giỏ Hàng
              </button>
              <button className="buy-now-btn" onClick={() => handleAddToCart(true)}>Mua Ngay</button>
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
                <div className="shop-online-status">
                  <span className={`status-dot ${product.shop.isOnline ? 'online' : 'offline'}`}></span>
                  {shopOnlineStatus}
                </div>
                <div className="shop-actions">
                  <button 
                    className="shop-view-btn" 
                    onClick={handleFollowShop}
                    disabled={isSubmittingFollow}
                    style={{ background: isFollowingStore ? "var(--background-alt)" : "white", color: isFollowingStore ? "var(--text-secondary)" : "var(--text-main)", border: "1px solid var(--border-color)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {isFollowingStore ? (
                        <path d="M20 6L9 17l-5-5"></path>
                      ) : (
                        <>
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </>
                      )}
                    </svg>
                    {isFollowingStore ? "Đang Theo Dõi" : "Theo Dõi"}
                  </button>
                  <button className="shop-view-btn" onClick={() => navigate(`/shop/${product.storeId || product.shop?._id || product.shop}`)}>
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
              <span className="spec-table-value">Ecommerce {">"} {product.categoryId?.name || "Khác"}</span>
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

        <div className="product-reviews-panel" style={{ marginTop: "20px", background: "var(--surface)", padding: "20px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}>
          <h3>ĐÁNH GIÁ SẢN PHẨM</h3>
          
          {/* Review Form */}
          <div className="review-form-container" style={{ marginBottom: "30px", paddingBottom: "20px", borderBottom: "1px solid var(--border-color)" }}>
            {user ? (
              <form onSubmit={handleReviewSubmit} className="review-form">
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Chọn số sao:</label>
                  <div className="star-selector" style={{ fontSize: "24px", color: "var(--warning)", cursor: "pointer" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        role="button"
                        tabIndex={0}
                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setReviewForm(prev => ({ ...prev, rating: star }));
                          }
                        }}
                        style={{ opacity: star <= reviewForm.rating ? 1 : 0.3 }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Hãy chia sẻ nhận xét của bạn về sản phẩm này nhé..."
                    style={{ width: "100%", minHeight: "100px", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", resize: "vertical" }}
                    required
                  ></textarea>
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Đính kèm hình ảnh (Tối đa 5 ảnh)</label>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 5) {
                        alert("Bạn chỉ được tải lên tối đa 5 ảnh.");
                        return;
                      }
                      setReviewImages(files);
                    }} 
                    style={{ marginBottom: "10px" }}
                  />
                  {reviewImages.length > 0 && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
                      {reviewImages.map((file, idx) => (
                        <img 
                          key={idx} 
                          src={URL.createObjectURL(file)} 
                          alt="preview" 
                          style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }} 
                        />
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" disabled={isSubmittingReview} className="primary-btn">
                  {isSubmittingReview ? "Đang gửi..." : "Gửi Đánh Giá"}
                </button>
                {reviewMessage && (
                  <p style={{ marginTop: "10px", color: reviewMessage.includes("thành công") ? "var(--success)" : "var(--error)" }}>
                    {reviewMessage}
                  </p>
                )}
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "20px", background: "var(--background-alt)", borderRadius: "var(--radius-sm)" }}>
                <p>Vui lòng đăng nhập để gửi đánh giá</p>
                <button onClick={onOpenLogin} className="primary-btn" style={{ marginTop: "10px" }}>Đăng nhập</button>
              </div>
            )}
          </div>

          {/* Review List */}
          <div className="review-list">
            {reviews.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!</p>
            ) : (
              reviews.map((review, index) => (
                <div key={review._id || index} className="review-item" style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "10px", fontWeight: "bold" }}>
                      {(review.userId?.name || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold" }}>{review.userId?.name || "Người dùng"}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  <div style={{ margin: "10px 0" }}>
                    {renderStars(review.rating)}
                  </div>
                  <p style={{ margin: 0, color: "var(--text-primary)", lineHeight: "1.5" }}>{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                      {review.images.map((img, idx) => {
                        const imgUrl = img.startsWith('http') ? img : `${apiUrl.replace('/api', '')}${img}`;
                        return (
                          <img 
                            key={idx} 
                            src={imgUrl} 
                            alt="Review" 
                            style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid rgba(0,0,0,0.05)", cursor: "pointer" }} 
                            onClick={() => window.open(imgUrl, '_blank')}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ProductDetailPage;
