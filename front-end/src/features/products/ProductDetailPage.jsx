import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../home/components/Header";
import { getAuthToken } from "../../utils/authStorage";
import { imageMap, formatPrice } from "../home/utils";
import { DATA_EVENTS, subscribeDataChanged } from "../../utils/realtimeEvents";
import VoucherModal from "../../components/VoucherModal";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function ProductDetailPage({ onOpenLogin, onOpenCart, user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [showColorSelectionModal, setShowColorSelectionModal] = useState(false);
  const [modalActionType, setModalActionType] = useState("add"); // "add" hoặc "buy"
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewImages, setReviewImages] = useState([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [isFollowingStore, setIsFollowingStore] = useState(false);
  const [isSubmittingFollow, setIsSubmittingFollow] = useState(false);
  const [shopOnlineStatus, setShopOnlineStatus] = useState("");
  const [showVouchers, setShowVouchers] = useState(false);

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

    // Yêu cầu chọn màu sắc nếu sản phẩm có biến thể màu
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      setModalActionType(isBuyNow ? "buy" : "add");
      setShowColorSelectionModal(true);
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
          quantity: quantity,
          color: (selectedColor && !selectedColor.isOriginal) ? selectedColor.name : undefined
        }),
      });
      if (response.ok) {
        if (isBuyNow) {
          onOpenCart();
        } else {
          // Success notification
          const displayAddedName = selectedColor && !selectedColor.isOriginal 
            ? `màu ${selectedColor.name} ` 
            : '';
          alert(`Sản phẩm ${displayAddedName}đã được thêm vào giỏ hàng!`);
          // Trigger header update
          if (window.emitDataChanged) {
            emitDataChanged({ type: DATA_EVENTS.PRODUCTS });
          } else {
            // fallback if emitDataChanged is not globally available
            window.location.reload();
          }
        }
      }
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
    }
  };

  const handleSearch = (keyword) => {
    navigate(`/home`);
  };

  const handleVoucherClick = () => {
    if (!user) {
      alert("Vui lòng đăng nhập để xem và lưu mã giảm giá.");
      onOpenLogin();
      return;
    }
    setShowVouchers(true);
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

  // Gộp tất cả ảnh: ảnh chính + ảnh từng màu vào 1 danh sách duy nhất
  const allImages = [
    ...(product?.images || []),
    ...((product?.colors || []).flatMap(c => c.images || [])),
  ].filter(Boolean);

  // Ảnh hiển thị: luôn là toàn bộ ảnh gộp
  const activeImages = allImages.length > 0 ? allImages : [];

  const nextImage = () => {
    if (!activeImages.length) return;
    setCurrentImageIdx((prev) => (prev + 1) % activeImages.length);
  };

  const prevImage = () => {
    if (!activeImages.length) return;
    setCurrentImageIdx((prev) => (prev - 1 + activeImages.length) % activeImages.length);
  };

  const getImageUrl = (img) => {
    if (!img) return "/images/iphone15pro.png";
    return imageMap[img] || img;
  };

  // Khi đổi màu, tự động chuyển ảnh chính đến ảnh đầu tiên của màu sắc đó
  const handleSelectColor = (color) => {
    let targetImage = null;

    if (color === "original") {
      setSelectedColor({
        name: "Sản phẩm gốc",
        price: product.price,
        discountPrice: product.discountPrice,
        stock: product.stock,
        isOriginal: true
      });
      if (product?.images && product.images.length > 0) {
        targetImage = product.images[0];
      }
    } else if (color === null) {
      setSelectedColor(null);
      if (product?.images && product.images.length > 0) {
        targetImage = product.images[0];
      }
    } else {
      const isAlreadySelected = selectedColor?.name === color.name && !selectedColor?.isOriginal;
      if (isAlreadySelected) {
        setSelectedColor(null);
        if (product?.images && product.images.length > 0) {
          targetImage = product.images[0];
        }
      } else {
        setSelectedColor(color);
        if (color.images && color.images.length > 0) {
          targetImage = color.images[0];
        }
      }
    }

    if (targetImage) {
      const allImgs = [
        ...(product?.images || []),
        ...((product?.colors || []).flatMap(c => c.images || [])),
      ].filter(Boolean);
      
      const idx = allImgs.indexOf(targetImage);
      if (idx !== -1) {
        setCurrentImageIdx(idx);
        return;
      }
    }
    setCurrentImageIdx(0);
  };

  // Giá hiển thị: theo màu nếu có, fallback về giá sản phẩm
  const displayPrice = selectedColor?.price ?? product?.price;
  const displayDiscountPrice = selectedColor?.discountPrice ?? product?.discountPrice;
  // Kho hiển thị: theo màu nếu có, fallback về kho sản phẩm
  const displayStock = selectedColor?.stock ?? product?.stock;

  const currentImageUrl = getImageUrl(activeImages[currentImageIdx] ?? activeImages[0]);
  const variantImageUrl = getImageUrl(activeImages[0]);

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
              {selectedColor && (
                <div style={{ position: "absolute", top: "10px", left: "10px", background: selectedColor.hex, color: "#fff", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(0,0,0,0.25)", mixBlendMode: "normal", border: "1px solid rgba(255,255,255,0.4)" }}>
                  {selectedColor.name}
                </div>
              )}
            </div>
            <div className="image-navigation">
              <button className="nav-btn prev" onClick={prevImage}>{"<"}</button>
              <div className="image-thumbnails">
                {(activeImages.length > 0 ? activeImages : [null, null, null, null, null]).map((img, idx) => (
                  <div 
                    key={`${product._id}-thumb-${idx}`} 
                    role="button"
                    tabIndex={0}
                    className={`thumbnail ${idx === currentImageIdx ? 'active' : ''}`}
                    onClick={() => setCurrentImageIdx(idx)}
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
                {selectedColor ? (
                  // 1. Khi ĐÃ CHỌN màu
                  selectedColor.discountPrice ? (
                    <>
                      <span className="original-price">{formatPrice(selectedColor.price)}₫</span>
                      <span className="current-price">{formatPrice(selectedColor.discountPrice)}₫</span>
                      <span className="discount-tag">{Math.round((1 - selectedColor.discountPrice / selectedColor.price) * 100)}% GIẢM</span>
                    </>
                  ) : (
                    <span className="current-price">{formatPrice(selectedColor.price)}₫</span>
                  )
                ) : (
                  // 2. Khi CHƯA CHỌN màu
                  product.colors && product.colors.length > 0 ? (() => {
                    const sellingPrices = product.colors.map(c => c.discountPrice || c.price);
                    const minSelling = Math.min(...sellingPrices);
                    const maxSelling = Math.max(...sellingPrices);
                    
                    if (minSelling !== maxSelling) {
                      return (
                        <span className="current-price">
                          {formatPrice(minSelling)}₫ - {formatPrice(maxSelling)}₫
                        </span>
                      );
                    } else {
                      // Tất cả các màu cùng giá bán
                      const colorWithDiscount = product.colors.find(c => c.discountPrice);
                      if (colorWithDiscount) {
                        return (
                          <>
                            <span className="original-price">{formatPrice(colorWithDiscount.price)}₫</span>
                            <span className="current-price">{formatPrice(minSelling)}₫</span>
                            <span className="discount-tag">{Math.round((1 - minSelling / colorWithDiscount.price) * 100)}% GIẢM</span>
                          </>
                        );
                      }
                      return <span className="current-price">{formatPrice(minSelling)}₫</span>;
                    }
                  })() : (
                    // Fallback khi sản phẩm không có biến thể màu sắc
                    product.discountPrice ? (
                      <>
                        <span className="original-price">{formatPrice(product.price)}₫</span>
                        <span className="current-price">{formatPrice(product.discountPrice)}₫</span>
                        <span className="discount-tag">{Math.round((1 - product.discountPrice / product.price) * 100)}% GIẢM</span>
                      </>
                    ) : (
                      <span className="current-price">{formatPrice(product.price)}₫</span>
                    )
                  )
                )}
              </div>
            </div>

            <div className="product-promotions">
              <div className="promo-row">
                <span className="promo-label">Mã Giảm Giá Của Shop</span>
                <div className="promo-tags">
                  <span className="shop-voucher" onClick={handleVoucherClick} style={{ cursor: 'pointer' }}>Giảm 17%</span>
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

              {/* ─── Màu sắc động từ product.colors ─── */}
              {product.colors && product.colors.length > 0 && (
                <div className="promo-row">
                  <span className="promo-label">Màu Sắc</span>
                  <div className="variant-options" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {/* Nút Sản phẩm gốc (Mặc định) */}
                    <button
                      onClick={() => handleSelectColor("original")}
                      style={{
                        padding: "7px 16px", borderRadius: "8px", cursor: "pointer",
                        border: selectedColor?.isOriginal ? "2px solid var(--shopee-red)" : "2px solid #e2e8f0",
                        background: selectedColor?.isOriginal ? "#fff5f5" : "white",
                        fontWeight: selectedColor?.isOriginal ? "700" : "500",
                        fontSize: "13px", transition: "all 0.15s",
                        boxShadow: selectedColor?.isOriginal ? "0 0 0 1px var(--shopee-red)" : "none",
                        color: selectedColor?.isOriginal ? "var(--shopee-red)" : "#222",
                      }}
                    >
                      Sản phẩm gốc
                    </button>

                    {product.colors.map((color, idx) => {
                      const isActive = selectedColor?.name === color.name && !selectedColor?.isOriginal;
                      return (
                        <button
                          key={`${product._id}-color-${idx}`}
                          onClick={() => handleSelectColor(color)}
                          style={{
                            padding: "7px 16px", borderRadius: "8px", cursor: "pointer",
                            border: isActive ? "2px solid var(--shopee-red)" : "2px solid #e2e8f0",
                            background: isActive ? "#fff5f5" : "white",
                            fontWeight: isActive ? "700" : "500",
                            fontSize: "13px", transition: "all 0.15s",
                            boxShadow: isActive ? "0 0 0 1px var(--shopee-red)" : "none",
                            color: isActive ? "var(--shopee-red)" : "#222",
                          }}
                        >
                          {color.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="promo-row">
                <span className="promo-label">Số Lượng</span>
                <div className="quantity-control-wrapper">
                  <div className="quantity-selector">
                    <button className="qty-btn" onClick={() => setQuantity(prev => Math.max(1, prev - 1))}>-</button>
                    <input type="text" value={quantity} readOnly className="qty-input" />
                    <button className="qty-btn" onClick={() => setQuantity(prev => Math.min(displayStock || 99, prev + 1))}>+</button>
                  </div>
                  <span className="stock-hint">
                    {selectedColor ? `${displayStock} sản phẩm màu ${selectedColor.name} có sẵn` : `${displayStock} sản phẩm có sẵn`}
                  </span>
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

        {/* Voucher Modal */}
        {showVouchers && <VoucherModal onClose={() => setShowVouchers(false)} />}

        {/* Modal Chọn Màu Sắc Premium */}
        {showColorSelectionModal && (
          <div 
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0, 0, 0, 0.6)", display: "flex", justifyContent: "center",
              alignItems: "center", zIndex: 1100, backdropFilter: "blur(4px)"
            }} 
            onClick={() => setShowColorSelectionModal(false)}
          >
            <div 
              style={{
                background: "white", width: "460px", borderRadius: "16px",
                padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                position: "relative", display: "flex", flexDirection: "column", gap: "20px",
                animation: "fadeIn 0.2s ease-out"
              }} 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Icon */}
              <button 
                style={{
                  position: "absolute", top: "16px", right: "16px", background: "none",
                  border: "none", fontSize: "26px", cursor: "pointer", color: "#888"
                }} 
                onClick={() => setShowColorSelectionModal(false)}
              >
                ×
              </button>

              {/* Product Info Summary */}
              <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
                <img 
                  src={currentImageUrl} 
                  alt={product.name} 
                  style={{ width: "90px", height: "90px", objectFit: "cover", borderRadius: "8px", border: "1px solid #f1f5f9" }} 
                />
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#222", lineHeight: "1.4" }}>
                    {product.name}
                  </h4>
                  <div style={{ color: "var(--shopee-red)", fontSize: "18px", fontWeight: "700" }}>
                    {selectedColor ? (
                      selectedColor.discountPrice ? `${formatPrice(selectedColor.discountPrice)}₫` : `${formatPrice(selectedColor.price)}₫`
                    ) : (
                      (() => {
                        const sellingPrices = product.colors.map(c => c.discountPrice || c.price);
                        const min = Math.min(...sellingPrices);
                        const max = Math.max(...sellingPrices);
                        return min === max ? `${formatPrice(min)}₫` : `${formatPrice(min)}₫ - ${formatPrice(max)}₫`;
                      })()
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    Kho: {selectedColor ? selectedColor.stock : product.stock} sản phẩm có sẵn
                  </div>
                </div>
              </div>

              {/* Color Options */}
              <div>
                <h5 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "600", color: "#555" }}>
                  Màu Sắc
                </h5>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {/* Nút Sản phẩm gốc */}
                  <button
                    onClick={() => handleSelectColor("original")}
                    style={{
                      padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
                      border: selectedColor?.isOriginal ? "2px solid var(--shopee-red)" : "2px solid #e2e8f0",
                      background: selectedColor?.isOriginal ? "#fff5f5" : "white",
                      fontWeight: selectedColor?.isOriginal ? "700" : "500",
                      fontSize: "13px", color: selectedColor?.isOriginal ? "var(--shopee-red)" : "#222",
                      transition: "all 0.15s"
                    }}
                  >
                    Sản phẩm gốc
                  </button>

                  {product.colors.map((color, idx) => {
                    const isActive = selectedColor?.name === color.name && !selectedColor?.isOriginal;
                    return (
                      <button
                        key={`modal-color-${idx}`}
                        onClick={() => handleSelectColor(color)}
                        style={{
                          padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
                          border: isActive ? "2px solid var(--shopee-red)" : "2px solid #e2e8f0",
                          background: isActive ? "#fff5f5" : "white",
                          fontWeight: isActive ? "700" : "500",
                          fontSize: "13px", color: isActive ? "var(--shopee-red)" : "#222",
                          transition: "all 0.15s"
                        }}
                      >
                        {color.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Selector */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee", paddingTop: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Số Lượng</span>
                <div className="quantity-selector" style={{ scale: "0.9" }}>
                  <button className="qty-btn" onClick={() => setQuantity(prev => Math.max(1, prev - 1))}>-</button>
                  <input type="text" value={quantity} readOnly className="qty-input" />
                  <button className="qty-btn" onClick={() => setQuantity(prev => Math.min(displayStock || 99, prev + 1))}>+</button>
                </div>
              </div>

              {/* Confirm Submit */}
              <button 
                onClick={() => {
                  if (!selectedColor) {
                    alert("Vui lòng chọn phân loại màu hoặc chọn Sản phẩm gốc!");
                    return;
                  }
                  setShowColorSelectionModal(false);
                  handleAddToCart(modalActionType === "buy");
                }}
                style={{
                  background: selectedColor ? "var(--shopee-red)" : "#cbd5e1",
                  color: "white", border: "none", borderRadius: "8px", padding: "14px",
                  fontSize: "15px", fontWeight: "700", cursor: selectedColor ? "pointer" : "not-allowed",
                  textAlign: "center", transition: "all 0.2s", marginTop: "10px"
                }}
              >
                {modalActionType === "buy" ? "MUA NGAY" : "THÊM VÀO GIỎ HÀNG"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default ProductDetailPage;
