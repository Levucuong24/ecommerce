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

const getStoreProducts = asyncHandler(async (req, res) => {
  const products = await storeService.getStoreProducts(req.params.id);
  res.json(products);
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

module.exports = {
  createStore,
  getMyStore,
  getStoreProducts,
  updateStore,
  getAllStores,
  updateStoreStatus,
};
