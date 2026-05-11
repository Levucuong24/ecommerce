const express = require("express");
const {
  Address,
  Category,
  Payment,
  Wishlist,
  Coupon,
  Notification,
} = require("../../models");
const {
  createListHandler,
  createDetailHandler,
} = require("./resource.controller");

const router = express.Router();

router.get("/addresses", createListHandler(Address));
router.get("/addresses/:id", createDetailHandler(Address));

router.get("/categories", createListHandler(Category));
router.get("/categories/:id", createDetailHandler(Category));

router.get("/payments", createListHandler(Payment));
router.get("/payments/:id", createDetailHandler(Payment));

router.get("/wishlist", createListHandler(Wishlist));
router.get("/wishlist/:id", createDetailHandler(Wishlist));

router.get("/coupons", createListHandler(Coupon));
router.get("/coupons/:id", createDetailHandler(Coupon));

router.get("/notifications", createListHandler(Notification));
router.get("/notifications/:id", createDetailHandler(Notification));

module.exports = router;
