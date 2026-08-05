const mongoose = require("mongoose");
const { User, Coupon } = require("../../models");
const { listResources, getResourceById } = require("../resource/resource.service");

const VALID_ROLES = new Set(["admin", "staff", "customer", "warehouse"]);

const getUsers = async (query) => listResources(User, query);

const getUserById = async (id) => getResourceById(User, id);

const updateUserRole = async (userId, role) => {
  if (!VALID_ROLES.has(role)) {
    const error = new Error("Invalid role");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const checkIn = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (user.lastCheckIn) {
    const lastCheckInDate = new Date(user.lastCheckIn);
    const lastCheckInStart = new Date(lastCheckInDate.getFullYear(), lastCheckInDate.getMonth(), lastCheckInDate.getDate());
    
    if (lastCheckInStart.getTime() === todayStart.getTime()) {
      const error = new Error("Hôm nay bạn đã điểm danh rồi!");
      error.statusCode = 400;
      throw error;
    }
  }

  const coinsAwarded = 200; // Award 200 coins per check-in
  user.coins = (user.coins || 0) + coinsAwarded;
  user.lastCheckIn = now;
  await user.save();

  return {
    coins: user.coins,
    coinsAwarded,
    lastCheckIn: user.lastCheckIn
  };
};

const getCoinsStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let checkedInToday = false;

  if (user.lastCheckIn) {
    const lastCheckInDate = new Date(user.lastCheckIn);
    const lastCheckInStart = new Date(lastCheckInDate.getFullYear(), lastCheckInDate.getMonth(), lastCheckInDate.getDate());
    if (lastCheckInStart.getTime() === todayStart.getTime()) {
      checkedInToday = true;
    }
  }

  return {
    coins: user.coins || 0,
    checkedInToday,
    lastCheckIn: user.lastCheckIn || null
  };
};

const generateRandomCode = (prefix, length = 6) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
};

const spinWheel = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const cost = 100;
  if ((user.coins || 0) < cost) {
    const error = new Error(`Bạn cần tối thiểu ${cost} xu để tham gia vòng quay may mắn!`);
    error.statusCode = 400;
    throw error;
  }

  // Khấu trừ 100 xu
  user.coins = (user.coins || 0) - cost;

  // Cấu hình phần quà:
  // Ô 0: Chúc bạn may mắn lần sau (60%)
  // Ô 1: Nhận 50 xu (15%)
  // Ô 2: Voucher giảm 10% (8%)
  // Ô 3: Nhận 200 xu (10%)
  // Ô 4: Voucher giảm 20.000đ (5%)
  // Ô 5: Nhận 500 xu (2%)
  const prizes = [
    { index: 0, name: "Chúc bạn may mắn lần sau", type: "none", weight: 60 },
    { index: 1, name: "Nhận 50 xu", type: "coins", value: 50, weight: 15 },
    { index: 2, name: "Voucher giảm 10%", type: "voucher", value: 10, discountType: "percentage", minOrder: 50000, weight: 8 },
    { index: 3, name: "Nhận 200 xu", type: "coins", value: 200, weight: 10 },
    { index: 4, name: "Voucher giảm 20.000đ", type: "voucher", value: 20000, discountType: "fixed", minOrder: 100000, weight: 5 },
    { index: 5, name: "Nhận 500 xu", type: "coins", value: 500, weight: 2 },
  ];

  const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.floor(Math.random() * totalWeight);
  let selectedPrize = prizes[0];

  for (const p of prizes) {
    if (random < p.weight) {
      selectedPrize = p;
      break;
    }
    random -= p.weight;
  }

  let coinsAwarded = 0;
  let couponCode = null;

  if (selectedPrize.type === "coins") {
    coinsAwarded = selectedPrize.value;
    user.coins += coinsAwarded;
  } else if (selectedPrize.type === "voucher") {
    const prefix = selectedPrize.discountType === "percentage" ? "LUCKY10P" : "LUCKY20K";
    couponCode = generateRandomCode(prefix);
    
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7);

    const coupon = new Coupon({
      _id: new mongoose.Types.ObjectId(),
      code: couponCode,
      discountType: selectedPrize.discountType,
      value: selectedPrize.value,
      minOrder: selectedPrize.minOrder,
      expiredAt,
      userId: user._id,
      limitPerUser: 1,
      usedBy: [],
      isActive: true,
    });
    await coupon.save();
  }

  await user.save();

  return {
    prizeIndex: selectedPrize.index,
    prizeName: selectedPrize.name,
    prizeType: selectedPrize.type,
    coinsAwarded,
    couponCode,
    remainingCoins: user.coins,
  };
};

module.exports = {
  getUsers,
  getUserById,
  updateUserRole,
  checkIn,
  getCoinsStatus,
  spinWheel,
};
