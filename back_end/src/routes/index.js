const express = require("express");

const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");
const productController = require("../controllers/product.controller");
const cartController = require("../controllers/cart.controller");
const orderController = require("../controllers/order.controller");
const reviewController = require("../controllers/review.controller");
const protect = require("../middleware/authMiddleware");
const {
  Address,
  Category,
  Payment,
  Wishlist,
  Coupon,
  Notification,
} = require("../models");
const {
  createListHandler,
  createDetailHandler,
} = require("../controllers/resource.controller");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/me", protect, authController.me);
router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/auth/reset-password", authController.resetPassword);

router.get("/users", userController.getUsers);
router.get("/users/:id", userController.getUserById);
router.get("/addresses", createListHandler(Address));
router.get("/addresses/:id", createDetailHandler(Address));
router.get("/categories", createListHandler(Category));
router.get("/categories/:id", createDetailHandler(Category));
router.get("/products", productController.getProducts);
router.get("/products/:id", productController.getProductById);
router.get("/reviews", reviewController.getReviews);
router.get("/reviews/:id", reviewController.getReviewById);
router.get("/cart", cartController.getCarts);
router.get("/cart/:id", cartController.getCartById);
router.get("/orders", orderController.getOrders);
router.get("/orders/:id", orderController.getOrderById);
router.get("/payments", createListHandler(Payment));
router.get("/payments/:id", createDetailHandler(Payment));
router.get("/wishlist", createListHandler(Wishlist));
router.get("/wishlist/:id", createDetailHandler(Wishlist));
router.get("/coupons", createListHandler(Coupon));
router.get("/coupons/:id", createDetailHandler(Coupon));
router.get("/notifications", createListHandler(Notification));
router.get("/notifications/:id", createDetailHandler(Notification));

module.exports = router;
