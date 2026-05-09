const asyncHandler = require("../middleware/asyncHandler");
const {
  getProducts,
  getProductById,
} = require("../services/productService");

const listProducts = asyncHandler(async (req, res) => {
    const data = await getProducts(req.query);
    res.json(data);
});

const getProductDetail = asyncHandler(async (req, res) => {
    const data = await getProductById(req.params.id);
    res.json(data);
});

module.exports = {
  getProducts: listProducts,
  getProductById: getProductDetail,
};
