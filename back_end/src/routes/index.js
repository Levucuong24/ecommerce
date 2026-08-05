const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const userRoutes = require("../modules/user/user.routes");
const productRoutes = require("../modules/product/product.routes");
const cartRoutes = require("../modules/cart/cart.routes");
const orderRoutes = require("../modules/order/order.routes");
const reviewRoutes = require("../modules/review/review.routes");
const storeRoutes = require("../modules/store/store.routes");
const notificationRoutes = require("../modules/notification/notification.routes");
const resourceRoutes = require("../modules/resource/resource.routes");
const chatRoutes = require("../modules/chat/chat.routes");
const couponRoutes = require("../modules/coupon/coupon.routes");
const inventoryRoutes = require("../modules/inventory/inventory.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/reviews", reviewRoutes);
router.use("/stores", storeRoutes);
router.use("/notifications", notificationRoutes);
router.use("/chats", chatRoutes);
router.use("/coupons", couponRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/", resourceRoutes);

module.exports = router;
