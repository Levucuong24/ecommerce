import React from "react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="ecommerce-footer">
      <div className="footer-container">
        
        {/* Main Grid */}
        <div className="footer-main-grid">
          
          {/* Column 1: Chăm sóc khách hàng */}
          <div className="footer-column">
            <h3>Chăm Sóc Khách Hàng</h3>
            <ul className="footer-links-list">
              <li><a href="#help">Trung Tâm Trợ Giúp</a></li>
              <li><a href="#blog">Ecommerce Blog</a></li>
              <li><a href="#guide-buy">Hướng Dẫn Mua Hàng</a></li>
              <li><a href="#guide-sell">Hướng Dẫn Bán Hàng</a></li>
              <li><a href="#payment">Thanh Toán</a></li>
              <li><a href="#refund">Trả Hàng & Hoàn Tiền</a></li>
              <li><a href="#warranty">Chính Sách Bảo Hành</a></li>
            </ul>
          </div>

          {/* Column 2: Về chúng tôi */}
          <div className="footer-column">
            <h3>Về Ecommerce</h3>
            <ul className="footer-links-list">
              <li><a href="#about">Giới Thiệu Về Ecommerce</a></li>
              <li><a href="#careers">Tuyển Dụng</a></li>
              <li><a href="#terms">Điều Khoản Ecommerce</a></li>
              <li><a href="#privacy">Chính Sách Bảo Mật</a></li>
              <li><a href="#mall">Chính Hãng</a></li>
              <li><a href="#seller-channel">Kênh Người Bán</a></li>
              <li><a href="#flashsale">Flash Sale</a></li>
            </ul>
          </div>

          {/* Column 3: Thanh toán & Vận chuyển */}
          <div className="footer-column">
            <h3>Thanh Toán</h3>
            <div className="icon-grid">
              {/* Visa */}
              <div className="icon-item" title="Visa">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="24">
                  <rect width="48" height="48" rx="4" fill="#1A1F71"/>
                  <path d="M19.124 30.648h3.336l2.083-12.784h-3.336l-2.083 12.784z" fill="#F7B600"/>
                  <path d="M36.19 18.067c-.822-.416-2.12-.865-3.714-.865-4.103 0-6.993 2.155-7.014 5.236-.024 2.278 2.063 3.543 3.636 4.305 1.614.78 2.158 1.277 2.152 1.97-.01 1.065-1.288 1.554-2.478 1.554-1.652 0-2.535-.25-3.882-.843l-.545-.256-.58 3.54c.966.442 2.748.828 4.6 0 4.35 0 7.186-2.125 7.218-5.412.023-1.803-1.09-3.178-3.486-4.308-1.45-.718-2.338-1.2-2.331-1.928.006-.66.745-1.34 2.37-1.34 1.348-.027 2.327.288 3.084.618l.368.163.517-3.44z" fill="#FFF"/>
                  <path d="M14.61 17.864l-3.23 8.784-.347-1.745c-.604-2.036-2.213-4.225-4.088-5.215l2.648 10.96h3.548l5.285-12.784h-3.816z" fill="#FFF"/>
                  <path d="M6.2 17.864c-.15.545-.37 1.258-.585 1.956L4.048 25.86c-.198.67-.32 1.09-.32 1.09l4.576-1.57c-.84-2.585-1.93-5.748-2.104-7.516z" fill="#F7B600"/>
                </svg>
              </div>
              {/* Mastercard */}
              <div className="icon-item" title="Mastercard">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="24">
                  <rect width="48" height="48" rx="4" fill="#222"/>
                  <circle cx="20" cy="24" r="11" fill="#EB001B" fillOpacity="0.9"/>
                  <circle cx="28" cy="24" r="11" fill="#F79E1B" fillOpacity="0.9"/>
                  <path d="M24 16.124a10.96 10.96 0 014.28 7.876 10.96 10.96 0 01-4.28 7.876 10.96 10.96 0 01-4.28-7.876 10.96 10.96 0 014.28-7.876z" fill="#FF5F00"/>
                </svg>
              </div>
              {/* JCB */}
              <div className="icon-item" title="JCB">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="24">
                  <rect width="48" height="48" rx="4" fill="#FFF" stroke="#e0e0e0" strokeWidth="1"/>
                  <path d="M12 14h24v20H12z" fill="#FFF"/>
                  <path d="M12 14h8v20h-8z" fill="#003594"/>
                  <path d="M20 14h8v20h-8z" fill="#D0021B"/>
                  <path d="M28 14h8v20h-8z" fill="#008234"/>
                  <text x="24" y="27" fill="#FFF" fontSize="10" fontWeight="800" textAnchor="middle">JCB</text>
                </svg>
              </div>
              {/* COD */}
              <div className="icon-item" title="Thanh toán khi nhận hàng (COD)">
                <span style={{ fontWeight: "800", fontSize: "0.7rem", color: "#111" }}>COD</span>
              </div>
            </div>

            <h3>Đơn Vị Vận Chuyển</h3>
            <div className="icon-grid">
              <div className="icon-item" title="SPX Express" style={{ background: "#ff5722", color: "#fff", fontWeight: "800", fontSize: "0.55rem" }}>
                <span>SPX</span>
              </div>
              <div className="icon-item" title="Giao Hàng Nhanh" style={{ background: "#4caf50", color: "#fff", fontWeight: "800", fontSize: "0.55rem" }}>
                <span>GHN</span>
              </div>
              <div className="icon-item" title="Giao Hàng Tiết Kiệm" style={{ background: "#009688", color: "#fff", fontWeight: "800", fontSize: "0.55rem" }}>
                <span>GHTK</span>
              </div>
              <div className="icon-item" title="Viettel Post" style={{ background: "#d32f2f", color: "#fff", fontWeight: "800", fontSize: "0.55rem" }}>
                <span>VTP</span>
              </div>
            </div>
          </div>

          {/* Column 4: Theo dõi chúng tôi */}
          <div className="footer-column">
            <h3>Theo Dõi Chúng Tôi</h3>
            <ul className="footer-links-list">
              <li>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                  </svg>
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.73 4.12 1.13 1.08 2.69 1.63 4.26 1.62v3.9c-1.89-.01-3.72-.67-5.18-1.85-.08.06-.11.12-.11.21-.02 4.41.02 8.82-.03 13.23-.15 2.29-1.2 4.48-3.07 5.79-2.22 1.5-5.16 1.83-7.65 1.03-3.15-1.04-5.46-4.08-5.38-7.46.07-4.14 3.73-7.66 7.9-7.44.41.02.82.08 1.22.18V7.47c-2.4-.41-4.93.07-6.95 1.49-2.52 1.82-3.8 5.06-3.11 8.16.66 2.92 3.04 5.37 5.99 6.03 2.9.61 6.03-.45 7.82-2.8 1.13-1.48 1.61-3.37 1.56-5.23-.02-3.89-.01-7.78-.01-11.67-.84.28-1.74.45-2.63.46-.38.01-.76-.01-1.14-.04V.02z"/>
                  </svg>
                  TikTok
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Tải ứng dụng */}
          <div className="footer-column">
            <h3>Tải Ứng Dụng Ecommerce</h3>
            <div className="download-wrapper">
              <div className="qr-code-box" title="Quét mã QR để tải ứng dụng">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 10h30v30H10V10zm6 6v18h18V16H16z" fill="#000"/>
                  <path d="M22 22h6v6h-6v-6z" fill="#000"/>
                  <path d="M60 10h30v30H60V10zm6 6v18h18V16H66z" fill="#000"/>
                  <path d="M72 22h6v6h-6v-6z" fill="#000"/>
                  <path d="M10 60h30v30H10V60zm6 6v18h18V66H16z" fill="#000"/>
                  <path d="M22 72h6v6h-6v-6z" fill="#000"/>
                  <path d="M50 50h10v10H50V50zm10 10h10v10H60V60zm10-10h10v10H70V50zm10 10h10v10H80V60zm-10 10h10v10H70V70zm10 10h10v10H80V80zm-30 0h10v10H50V80zm0-20h10v10H50V60zm10-10h10v10H60V50z" fill="#000"/>
                </svg>
              </div>
              <div className="app-stores">
                <a href="#appstore" className="store-badge">
                  <span>🍎 App Store</span>
                </a>
                <a href="#googleplay" className="store-badge">
                  <span>🤖 Google Play</span>
                </a>
                <a href="#appgallery" className="store-badge">
                  <span>📱 AppGallery</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-meta-info">
            <a href="#terms">CHÍNH SÁCH BẢO MẬT</a> | 
            <a href="#terms">QUY CHẾ HOẠT ĐỘNG</a> | 
            <a href="#terms">CHÍNH SÁCH VẬN CHUYỂN</a> | 
            <a href="#terms">CHÍNH SÁCH TRẢ HÀNG VÀ HOÀN TIỀN</a>
          </div>

          <div className="registered-badge">
            <svg width="120" height="45" viewBox="0 0 120 45" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="120" height="45" rx="4" fill="#008234"/>
              <text x="60" y="20" fill="#FFF" fontSize="6.5" fontWeight="800" textAnchor="middle">ĐÃ ĐĂNG KÝ</text>
              <text x="60" y="32" fill="#F79E1B" fontSize="7" fontWeight="900" textAnchor="middle">BỘ CÔNG THƯƠNG</text>
              <circle cx="20" cy="22" r="5" fill="#FFF" opacity="0.3"/>
              <circle cx="100" cy="22" r="5" fill="#FFF" opacity="0.3"/>
            </svg>
          </div>

          <div className="footer-company-details">
            <p style={{ fontWeight: "700", marginBottom: "5px" }}>Công ty TNHH Ecommerce Việt Nam</p>
            <p>Địa chỉ: Tầng 29, Tòa nhà Trung tâm Lotte Hà Nội, 54 Liễu Giai, Phường Cống Vị, Quận Ba Đình, Thành phố Hà Nội, Việt Nam.</p>
            <p>Mã số doanh nghiệp: 0106772222 do Sở Kế hoạch & Đầu tư TP. Hà Nội cấp lần đầu ngày 10/02/2015.</p>
            <p>Điện thoại hỗ trợ: 1900 1221 - Email: cskh@ecommerce.vn</p>
          </div>

          <div className="footer-copyright">
            © 2026 Ecommerce. Tất cả các quyền được bảo lưu.
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
