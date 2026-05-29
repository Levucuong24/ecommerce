const asyncHandler = require("../../middleware/asyncHandler");
const couponService = require("./coupon.service");
const Store = require("../../models/store.model");

const getStoreCoupons = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ ownerId: req.user.id });
  if (!store) {
    return res.status(404).json({ message: "Không tìm thấy cửa hàng của bạn" });
  }
  const coupons = await couponService.getStoreCoupons(store._id);
  res.json(coupons);
});

const createStoreCoupon = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ ownerId: req.user.id });
  if (!store) {
    return res.status(404).json({ message: "Không tìm thấy cửa hàng của bạn" });
  }
  const coupon = await couponService.createStoreCoupon(store._id, req.body);
  res.status(201).json(coupon);
});

const deleteStoreCoupon = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ ownerId: req.user.id });
  if (!store) {
    return res.status(404).json({ message: "Không tìm thấy cửa hàng của bạn" });
  }
  await couponService.deleteStoreCoupon(store._id, req.params.id);
  res.json({ message: "Vô hiệu hóa mã giảm giá thành công" });
});

const getApplicableCoupons = asyncHandler(async (req, res) => {
  const { storeIds, userId } = req.query;
  const storeIdsArr = storeIds ? storeIds.split(",") : [];
  const coupons = await couponService.getApplicableCoupons(storeIdsArr, userId || req.user?.id);
  
  // Format items inside generic pagination envelope for compatibility with front-end
  res.json({
    items: coupons,
    pagination: {
      total: coupons.length,
      page: 1,
      limit: coupons.length,
      pages: 1
    }
  });
});

module.exports = {
  getStoreCoupons,
  createStoreCoupon,
  deleteStoreCoupon,
  getApplicableCoupons,
};
