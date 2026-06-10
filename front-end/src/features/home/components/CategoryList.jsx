import { useRef } from "react";
import { useNavigate } from "react-router-dom";

const categoryIcons = {
  "Thời Thời Trang Nam": "👕",
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
      // Scroll by clients width
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
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
          <h2>Danh mục nổi bật</h2>
        </div>
        <div className="empty-state">
          <p>Không có dữ liệu danh mục.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="category-strip category-carousel-container animate-fade">
      <div className="section-heading">
        <h2>Khám Phá Danh Mục</h2>
      </div>
      
      <div className="category-carousel-wrapper">
        <button 
          type="button"
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
            >
              <div className="category-icon-placeholder">
                {getCategoryIcon(category.name)}
              </div>
              <span className="category-name">{category.name}</span>
            </div>
          ))}
        </div>

        <button 
          type="button"
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
