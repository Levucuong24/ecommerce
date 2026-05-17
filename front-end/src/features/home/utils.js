
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

export const mockVouchers = [
  { id: 'v1', code: 'DISC17', title: 'Giảm 17%', minOrder: 100000, discountPercent: 17, type: 'percent', exp: '30/06/2026' },
  { id: 'v2', code: 'DISC25K', title: 'Giảm 25K', minOrder: 200000, discountAmount: 25000, type: 'fixed', exp: '30/06/2026' },
  { id: 'v3', code: 'FREESHIP', title: 'Miễn Phí Vận Chuyển', minOrder: 50000, discountAmount: 15000, type: 'fixed', exp: '30/06/2026' },
  { id: 'v4', code: 'DISC50K', title: 'Giảm 50K', minOrder: 500000, discountAmount: 50000, type: 'fixed', exp: '30/06/2026' }
];

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
