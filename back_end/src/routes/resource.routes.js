const express = require("express");
const {
  Address,
  Category,
  Payment,
  Wishlist,
  Coupon,
  Notification,
} = require("../models");
const resourceController = require("../controllers/resource/resource.controller");

const router = express.Router();

router.get("/addresses", resourceController.createListHandler(Address));
router.get("/addresses/:id", resourceController.createDetailHandler(Address));

router.get("/categories", resourceController.createListHandler(Category));
router.get("/categories/:id", resourceController.createDetailHandler(Category));

router.get("/payments", resourceController.createListHandler(Payment));
router.get("/payments/:id", resourceController.createDetailHandler(Payment));

router.get("/wishlist", resourceController.createListHandler(Wishlist));
router.get("/wishlist/:id", resourceController.createDetailHandler(Wishlist));

router.get("/coupons", resourceController.createListHandler(Coupon));
router.get("/coupons/:id", resourceController.createDetailHandler(Coupon));

router.get("/notifications", resourceController.createListHandler(Notification));
router.get("/notifications/:id", resourceController.createDetailHandler(Notification));

module.exports = router;
