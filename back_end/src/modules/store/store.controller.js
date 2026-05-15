const asyncHandler = require("../../middleware/asyncHandler");
const storeService = require("./store.service");

const createStore = asyncHandler(async (req, res) => {
  const store = await storeService.createStore(req.user.id, req.body);
  res.status(201).json(store);
});

const getMyStore = asyncHandler(async (req, res) => {
  const store = await storeService.getMyStore(req.user.id);
  res.json(store);
});

const getStoreById = asyncHandler(async (req, res) => {
  const store = await storeService.getStoreById(req.params.id);
  res.json(store);
});

const getStoreProducts = asyncHandler(async (req, res) => {
  const products = await storeService.getStoreProducts(req.params.id);
  res.json(products);
});

const getStoreReviews = asyncHandler(async (req, res) => {
  const reviews = await storeService.getStoreReviews(req.params.id);
  res.json(reviews);
});

const updateStore = asyncHandler(async (req, res) => {
  const store = await storeService.updateStore(req.user.id, req.body);
  res.json(store);
});

const getAllStores = asyncHandler(async (req, res) => {
  const stores = await storeService.getAllStores(req.query);
  res.json(stores);
});

const updateStoreStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const store = await storeService.approveStore(id, status);
  res.json(store);
});

const toggleFollowStore = asyncHandler(async (req, res) => {
  const result = await storeService.toggleFollowStore(req.user.id, req.params.id);
  res.json(result);
});

const getFollowingStores = asyncHandler(async (req, res) => {
  const stores = await storeService.getFollowingStores(req.user.id);
  res.json(stores);
});

const updateOnlineStatus = asyncHandler(async (req, res) => {
  const { isOnline } = req.body;
  const store = await storeService.updateStoreOnlineStatus(req.user.id, isOnline);
  res.json(store);
});

module.exports = {
  createStore,
  getMyStore,
  getStoreById,
  getStoreProducts,
  getStoreReviews,
  updateStore,
  getAllStores,
  updateStoreStatus,
  toggleFollowStore,
  getFollowingStores,
  updateOnlineStatus,
};
