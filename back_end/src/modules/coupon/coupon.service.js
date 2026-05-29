const mongoose = require("mongoose");
const Coupon = require("../../models/coupon.model");
const Store = require("../../models/store.model");

const getStoreCoupons = async (storeId) => {
  return await Coupon.find({ storeId }).sort({ createdAt: -1 });
};

const createStoreCoupon = async (storeId, couponData) => {
  // Enforce code is unique and uppercase
  const code = couponData.code.trim().toUpperCase();
  const existing = await Coupon.findOne({ code });
  if (existing) {
    const error = new Error("Mã giảm giá này đã tồn tại trong hệ thống");
    error.statusCode = 400;
    throw error;
  }

  const coupon = new Coupon({
    _id: new mongoose.Types.ObjectId(),
    code,
    discountType: couponData.discountType,
    value: Number(couponData.value),
    minOrder: Number(couponData.minOrder || 0),
    maxUsage: couponData.maxUsage ? Number(couponData.maxUsage) : undefined,
    expiredAt: couponData.expiredAt ? new Date(couponData.expiredAt) : undefined,
    limitPerUser: Number(couponData.limitPerUser || 1),
    storeId,
    isActive: true,
  });

  return await coupon.save();
};

const deleteStoreCoupon = async (storeId, couponId) => {
  const coupon = await Coupon.findOne({ _id: couponId, storeId });
  if (!coupon) {
    const error = new Error("Không tìm thấy mã giảm giá của cửa hàng");
    error.statusCode = 404;
    throw error;
  }
  // Soft delete by setting isActive to false
  coupon.isActive = false;
  return await coupon.save();
};

const getApplicableCoupons = async (storeIds = [], userId = null) => {
  const now = new Date();
  
  // Find all coupons that are active, not expired
  const query = {
    isActive: true,
    $or: [
      { expiredAt: { $exists: false } },
      { expiredAt: null },
      { expiredAt: { $gt: now } }
    ]
  };

  // Restrict to platform-wide OR assigned to user OR matching storeIds
  const orConditions = [
    { storeId: null, userId: null }, // Platform-wide
  ];

  if (userId) {
    orConditions.push({ userId }); // Assigned to specific user
  }

  if (storeIds.length > 0) {
    // Map string IDs to ObjectIds
    const storeObjectIds = storeIds
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
      
    if (storeObjectIds.length > 0) {
      orConditions.push({ storeId: { $in: storeObjectIds } }); // Belong to shopping cart stores
    }
  }

  query.$and = [{ $or: orConditions }];

  // Fetch and populate storeId for followers check
  const coupons = await Coupon.find(query).populate("storeId");
  
  // Filter coupons by user usage limit
  if (userId) {
    return coupons.filter(c => {
      if (!c.usedBy) return true;
      const usageCount = c.usedBy.filter(id => id.toString() === userId.toString()).length;
      const limit = c.limitPerUser || 1;
      return usageCount < limit;
    });
  }

  return coupons;
};

module.exports = {
  getStoreCoupons,
  createStoreCoupon,
  deleteStoreCoupon,
  getApplicableCoupons,
};
