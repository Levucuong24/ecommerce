import { useRef } from "react";
import { useNavigate } from "react-router-dom";

const categoryIcons = {
  "Thời Trang Nam": "👕",
  "Điện Thoại & Phụ Kiện": "📱",
  "Thiết Bị Điện Tử": "🔌",
  "Máy Tính & Laptop": "💻",
  "Máy Ảnh & Máy Quay Phim": "📷",
  "Đồng Hồ": "⌚",
  "Giày Dép Nam": "👞",
  "Thiết Bị Điện Gia Dụng": "🏠",
  "Thể Thao & Du Lịch": "⚽",
  "Ô Tô & Xe Máy & Xe Đạp": "🚗",
  "Thời Trang Nữ": "👗",
  "Mẹ & Bé": "👶",
  "Nhà Cửa & Đời Sống": "🛋️",
  "Sắc Đẹp": "💄",
  "Sức Khỏe": "💊",
  "Giày Dép Nữ": "👠",
  "Túi Ví Nữ": "👜",
  "Phụ Kiện & Trang Sức Nữ": "💍",
  "Bách Hóa Online": "🛒",
  "Nhà Sách Online": "📚",
  "Balo & Túi Ví Nam": "🎒",
  "Đồ Chơi": "🧸",
  "Chăm Sóc Thú Cưng": "🐾",
  "Dụng Cụ và Thiết Bị Tiện Ích": "🛠️",
  "Thời Trang Trẻ Em": "🚼",
  "Giặt Giũ & Chăm Sóc Nhà Cửa": "🧹",
  "Voucher & Dịch Vụ": "🎟️",
  "Thực Phẩm & Đồ Uống": "🍔",
  "Văn Phòng Phẩm": "✏️",
  "Máy Chơi Game & Phụ Kiện": "🎮",
  "Nhạc Cụ": "🎸"
};

const getCategoryIcon = (name) => {
  return categoryIcons[name] || name.charAt(0).toUpperCase();
};

function CategoryList({ categories }) {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    const targetUrl = `/${category.slug}-${category._id}`;
    navigate(targetUrl);
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      // Scroll by exactly one visible page/face
      const scrollAmount = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: "smooth" 
      });
    }
  };

  if (!categories || categories.length === 0) {
    return (
      <section className="category-strip">
        <div className="section-heading">
          <h2>Danh mục</h2>
        </div>
        <div className="empty-state">
          <p>Chưa có danh mục nào.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="category-strip category-carousel-container">
      <div className="section-heading">
        <h2>Danh mục</h2>
      </div>
      <div className="category-carousel-wrapper">
        <button 
          className="carousel-btn left-btn" 
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          &#10094;
        </button>
        
        <div className="category-grid" ref={scrollRef}>
          {categories.map((category) => (
            <div 
              key={category._id} 
              className="category-chip"
              onClick={() => handleCategoryClick(category)}
              style={{ cursor: 'pointer' }}
            >
              <div className="category-icon-placeholder">
                {getCategoryIcon(category.name)}
              </div>
              <span className="category-name">{category.name}</span>
            </div>
          ))}
        </div>

        <button 
          className="carousel-btn right-btn" 
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          &#10095;
        </button>
      </div>
    </section>
  );
}

export default CategoryList;
