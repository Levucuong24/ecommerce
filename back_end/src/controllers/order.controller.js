const asyncHandler = require("../middleware/asyncHandler");
const { getOrders, getOrderById } = require("../services/orderService");

const listOrders = asyncHandler(async (req, res) => {
    const data = await getOrders(req.query);
    res.json(data);
});

const getOrderDetail = asyncHandler(async (req, res) => {
    const data = await getOrderById(req.params.id);
    res.json(data);
});

module.exports = {
  getOrders: listOrders,
  getOrderById: getOrderDetail,
};
