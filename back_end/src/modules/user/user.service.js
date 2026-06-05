const { User } = require("../../models");
const { listResources, getResourceById } = require("../resource/resource.service");

const VALID_ROLES = new Set(["admin", "staff", "customer"]);

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

module.exports = {
  getUsers,
  getUserById,
  updateUserRole,
  checkIn,
  getCoinsStatus,
};
