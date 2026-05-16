const express = require("express");
const cartController = require("./cart.controller");

const protect = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, cartController.getMyCart);
router.post("/", protect, cartController.addItemToCart);
router.delete("/:productId", protect, cartController.removeItemFromCart);

module.exports = router;
