const asyncHandler = require("../../middleware/asyncHandler");
const cartService = require("./cart.service");

const listCarts = asyncHandler(async (req, res) => {
    const data = await cartService.getCarts(req.query);
    res.json(data);
});

const getCartDetail = asyncHandler(async (req, res) => {
    const data = await cartService.getCartById(req.params.id);
    res.json(data);
});

module.exports = {
  getCarts: listCarts,
  getCartById: getCartDetail,
};
