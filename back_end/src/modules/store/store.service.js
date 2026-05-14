const mongoose = require("mongoose");
const { Store, Product } = require("../../models");
const slugify = require("../../utils/slugify");

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

const getStoreProducts = async (storeId) => {
  return await Product.find({ storeId });
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

module.exports = {
  createStore,
  getMyStore,
  getStoreProducts,
  updateStore,
  getAllStores,
  approveStore,
};
