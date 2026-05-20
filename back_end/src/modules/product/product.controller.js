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

const toggleLikeProduct = asyncHandler(async (req, res) => {
    const data = await productService.toggleLikeProduct(req.params.id, req.user.id);
    res.json(data);
});

const getLikedProducts = asyncHandler(async (req, res) => {
  const data = await productService.getLikedProducts(req.user.id);
  res.json(data);
});

const toggleFlashSale = asyncHandler(async (req, res) => {
  const { enable, startTime, endTime, flashSaleDiscountPercent } = req.body;
  const productId = req.params.id;
  const updatedProduct = await productService.toggleFlashSale(
    productId,
    req.user,
    enable,
    startTime,
    endTime,
    flashSaleDiscountPercent
  );
  res.json(updatedProduct);
});

module.exports = {
  getProducts: listProducts,
  getProductById: getProductDetail,
  createProduct,
  toggleLikeProduct,
  getLikedProducts,
  toggleFlashSale,
};
