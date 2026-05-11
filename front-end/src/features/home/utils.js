import iphone15Pro from "../../assets/images/iphone15pro.png";

export const quickLinks = [
  { label: "Voucher", icon: "/images/voucher.png" },
  { label: "Free Ship", icon: "/images/freeship.png" },
  { label: "Mall", icon: "/images/mall.png" },
  { label: "Flash Sale", icon: "/images/flashsale.png" },
  { label: "Nap The", icon: "/images/napthe.png" },
  { label: "Do Dien Tu", icon: "/images/dodientu.png" },
  { label: "Lam Dep", icon: "/images/lamdep.png" },
  { label: "Gia Dung", icon: "/images/giadung.png" },
];

export const bannerImages = [
  "/images/flashsale.png",
  "/images/mall.png",
  "/images/voucher.png",
];

export const fallbackCategories = [
  "Thoi Trang",
  "Dien Thoai",
  "Laptop",
  "Gia Dung",
  "My Pham",
  "Me Va Be",
  "The Thao",
  "Nha Cua",
];

export const fallbackProducts = [
  { name: "Tai nghe Bluetooth Pro", price: 449000, sold: "Da ban 2,1k", badge: "-18%" },
  { name: "May loc khong khi mini", price: 1290000, sold: "Da ban 860", badge: "-25%" },
  { name: "Balo laptop chong nuoc", price: 329000, sold: "Da ban 1,4k", badge: "-12%" },
  { name: "Ban phim co gaming", price: 799000, sold: "Da ban 980", badge: "-15%" },
  { name: "Den hoc LED cam ung", price: 259000, sold: "Da ban 730", badge: "-10%" },
  { name: "Dong ho thong minh S8", price: 1590000, sold: "Da ban 1,1k", badge: "-22%" },
];

export const formatPrice = (value) => Number(value || 0).toLocaleString("vi-VN");

export const imageMap = {
  "iphone15.jpg": iphone15Pro,
  "iphone15pro.png": iphone15Pro,
};

export const buildBadge = (price, discountPrice) => {
  if (!discountPrice || discountPrice >= price || !price) {
    return "Moi";
  }

  const percent = Math.round(((price - discountPrice) / price) * 100);
  return `-${percent}%`;
};
