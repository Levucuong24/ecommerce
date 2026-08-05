const express = require("express");
const orderController = require("./order.controller");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const router = express.Router();

// Order routing
router.post("/", protect, orderController.createOrder);
router.get("/my", protect, orderController.getMyOrders);
router.get("/store", protect, authorize("staff", "admin", "warehouse"), orderController.getStoreOrders);
router.patch("/:id/status", protect, orderController.updateOrderStatus);

// Admin / Warehouse query all orders
router.get("/", protect, authorize("admin", "warehouse"), orderController.getOrders);
router.get("/:id", protect, orderController.getOrderById);

module.exports = router;
