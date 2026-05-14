
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

export const formatPrice = (value) => Number(value || 0).toLocaleString("vi-VN");

export const imageMap = {
  "iphone15.jpg": "/images/iphone15pro.png",
  "iphone15pro.png": "/images/iphone15pro.png",
};

export const buildBadge = (price, discountPrice) => {
  if (!discountPrice || discountPrice >= price || !price) {
    return "Moi";
  }

  const percent = Math.round(((price - discountPrice) / price) * 100);
  return `-${percent}%`;
};
