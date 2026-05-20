const express = require("express");
const productController = require("./product.controller");

const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const router = express.Router();

router.get("/", productController.getProducts);
router.get("/liked", protect, productController.getLikedProducts);
router.get("/:id", productController.getProductById);
router.post("/:id/like", protect, productController.toggleLikeProduct);
router.post("/:id/flash-sale", protect, authorize("staff", "admin"), productController.toggleFlashSale);
router.post("/", protect, authorize("staff", "admin"), productController.createProduct);

module.exports = router;
