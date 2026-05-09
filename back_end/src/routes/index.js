const express = require("express");

const { createListHandler } = require("../controllers/resource.controller");
const {
  User,
  Address,
  Category,
  Product,
  Review,
  Cart,
  Order,
  Payment,
  Wishlist,
  Coupon,
  Notification,
} = require("../models");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.get("/users", createListHandler(User));
router.get("/addresses", createListHandler(Address));
router.get("/categories", createListHandler(Category));
router.get("/products", createListHandler(Product));
router.get("/reviews", createListHandler(Review));
router.get("/cart", createListHandler(Cart));
router.get("/orders", createListHandler(Order));
router.get("/payments", createListHandler(Payment));
router.get("/wishlist", createListHandler(Wishlist));
router.get("/coupons", createListHandler(Coupon));
router.get("/notifications", createListHandler(Notification));

router.use((error, req, res, next) => {
  res.status(500).json({
    message: error.message || "Internal server error",
  });
});

module.exports = router;
