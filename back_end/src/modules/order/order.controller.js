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

module.exports = {
  getOrders: listOrders,
  getOrderById: getOrderDetail,
};
