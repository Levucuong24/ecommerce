const asyncHandler = require("../../middleware/asyncHandler");
const cartService = require("./cart.service");

const addItemToCart = asyncHandler(async (req, res) => {
    const { productId, quantity, replace, color } = req.body;
    const data = await cartService.addToCart(req.user.id, productId, quantity || 1, replace, color);
    res.json(data);
});

const getMyCart = asyncHandler(async (req, res) => {
    const data = await cartService.getMyCart(req.user.id);
    res.json(data || { items: [] });
});

const removeItemFromCart = asyncHandler(async (req, res) => {
    const { color } = req.query;
    const data = await cartService.removeFromCart(req.user.id, req.params.productId, color);
    res.json(data);
});

const clearMyCart = asyncHandler(async (req, res) => {
    const data = await cartService.clearCart(req.user.id);
    res.json(data);
});

module.exports = {
  addItemToCart,
  getMyCart,
  removeItemFromCart,
  clearMyCart,
};
