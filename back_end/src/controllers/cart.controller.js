const asyncHandler = require("../middleware/asyncHandler");
const { getCarts, getCartById } = require("../services/cartService");

const listCarts = asyncHandler(async (req, res) => {
    const data = await getCarts(req.query);
    res.json(data);
});

const getCartDetail = asyncHandler(async (req, res) => {
    const data = await getCartById(req.params.id);
    res.json(data);
});

module.exports = {
  getCarts: listCarts,
  getCartById: getCartDetail,
};
