const express = require("express");
const orderController = require("../controllers/order/order.controller");

const router = express.Router();

router.get("/", orderController.getOrders);
router.get("/:id", orderController.getOrderById);

module.exports = router;
