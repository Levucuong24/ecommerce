const asyncHandler = require("../../middleware/asyncHandler");
const productService = require("./product.service");

const listProducts = asyncHandler(async (req, res) => {
    const data = await productService.getProducts(req.query);
    res.json(data);
});

const getProductDetail = asyncHandler(async (req, res) => {
    const data = await productService.getProductById(req.params.id);
    res.json(data);
});

const createProduct = asyncHandler(async (req, res) => {
    const data = await productService.createProduct(req.user.id, req.body);
    res.status(201).json(data);
});

module.exports = {
  getProducts: listProducts,
  getProductById: getProductDetail,
  createProduct,
};
