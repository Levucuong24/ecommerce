const express = require("express");
const productController = require("./product.controller");

const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const router = express.Router();

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.post("/", protect, authorize("staff", "admin"), productController.createProduct);

module.exports = router;
