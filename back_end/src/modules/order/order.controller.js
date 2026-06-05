const asyncHandler = require("../../middleware/asyncHandler");
const orderService = require("./order.service");

const listOrders = asyncHandler(async (req, res) => {
  const data = await orderService.getOrders(req.query);
  res.json(data);
});

const getOrderDetail = asyncHandler(async (req, res) => {
  const data = await orderService.getOrderById(req.params.id);
  res.json(data);
});

const createOrder = asyncHandler(async (req, res) => {
  const { addressSnapshot, paymentMethod, selectedVoucherId, useCoins } = req.body;
  
  if (!addressSnapshot || !addressSnapshot.fullName || !addressSnapshot.phone || !addressSnapshot.detail) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin giao hàng (tên, số điện thoại, địa chỉ chi tiết)" });
  }

  const data = await orderService.createOrder(
    req.user.id,
    addressSnapshot,
    paymentMethod,
    selectedVoucherId,
    useCoins
  );
  
  res.status(201).json(data);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const data = await orderService.getMyOrders(req.user.id);
  res.json(data);
});

const getStoreOrders = asyncHandler(async (req, res) => {
  const data = await orderService.getStoreOrders(req.user.id);
  res.json(data);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Vui lòng cung cấp trạng thái mới" });
  }

  const data = await orderService.updateOrderStatus(
    id,
    req.user.id,
    req.user.role,
    status
  );
  
  res.json(data);
});

module.exports = {
  getOrders: listOrders,
  getOrderById: getOrderDetail,
  createOrder,
  getMyOrders,
  getStoreOrders,
  updateOrderStatus,
};
