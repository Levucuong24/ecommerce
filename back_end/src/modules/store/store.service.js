const mongoose = require("mongoose");
const { Store, Product, Review } = require("../../models");
const slugify = require("../../utils/slugify");
const { deactivateExpiredFlashSales } = require("../product/product.service");

const createStore = async (userId, storeData) => {
  // Check if user already has a store
  const existingStore = await Store.findOne({ ownerId: userId });
  if (existingStore) {
    const error = new Error("User already has a store");
    error.statusCode = 400;
    throw error;
  }

  const slug = slugify(storeData.name);
  
  const store = await Store.create({
    _id: new mongoose.Types.ObjectId(),
    ...storeData,
    slug,
    ownerId: userId,
  });

  return store;
};

const getMyStore = async (userId) => {
  const store = await Store.findOne({ ownerId: userId });
  if (!store) {
    return null;
  }
  return store;
};

const getStoreById = async (storeId) => {
  const store = await Store.findById(storeId);
  if (!store) {
    const error = new Error("Store not found");
    error.statusCode = 404;
    throw error;
  }
  return store;
};

const getStoreProducts = async (storeId) => {
  await deactivateExpiredFlashSales();
  return await Product.find({ storeId });
};

const getStoreReviews = async (storeId) => {
  const products = await Product.find({ storeId });
  const productIds = products.map((p) => p._id);
  return await Review.find({ productId: { $in: productIds } })
    .populate("userId", "name email")
    .populate("productId", "name")
    .sort({ createdAt: -1 });
};

const updateStore = async (userId, storeData) => {
  const store = await Store.findOne({ ownerId: userId });
  if (!store) {
    const error = new Error("Store not found");
    error.statusCode = 404;
    throw error;
  }

  if (storeData.name) {
    storeData.slug = slugify(storeData.name);
  }

  Object.assign(store, storeData);
  await store.save();
  return store;
};

const getAllStores = async (query) => {
  return await Store.find(query).populate("ownerId", "name email");
};

const approveStore = async (storeId, status) => {
  const store = await Store.findById(storeId);
  if (!store) {
    const error = new Error("Store not found");
    error.statusCode = 404;
    throw error;
  }

  store.status = status;
  await store.save();
  return store;
};

const toggleFollowStore = async (userId, storeId) => {
  const store = await Store.findById(storeId);
  if (!store) {
    const error = new Error("Store not found");
    error.statusCode = 404;
    throw error;
  }

  // Initialize followers array if it doesn't exist
  if (!store.followers) {
    store.followers = [];
  }

  const isFollowing = store.followers.includes(userId);
  
  if (isFollowing) {
    // Unfollow
    store.followers = store.followers.filter(id => id.toString() !== userId.toString());
  } else {
    // Follow
    store.followers.push(userId);
  }
  
  store.followerCount = store.followers.length;
  await store.save();
  
  return {
    isFollowing: !isFollowing,
    followerCount: store.followerCount
  };
};

const getFollowingStores = async (userId) => {
  return await Store.find({ followers: userId })
    .select("name logo description followerCount createdAt")
    .sort({ createdAt: -1 });
};

const updateStoreOnlineStatus = async (userId, isOnline) => {
  const store = await Store.findOne({ ownerId: userId });
  if (store) {
    store.isOnline = isOnline;
    store.lastActive = new Date();
    await store.save();
  }
  return store;
};

module.exports = {
  createStore,
  getMyStore,
  getStoreById,
  getStoreProducts,
  getStoreReviews,
  updateStore,
  getAllStores,
  approveStore,
  toggleFollowStore,
  getFollowingStores,
  updateStoreOnlineStatus,
};
