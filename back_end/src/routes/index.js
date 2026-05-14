const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const userRoutes = require("../modules/user/user.routes");
const productRoutes = require("../modules/product/product.routes");
const cartRoutes = require("../modules/cart/cart.routes");
const orderRoutes = require("../modules/order/order.routes");
const reviewRoutes = require("../modules/review/review.routes");
const storeRoutes = require("../modules/store/store.routes");
const resourceRoutes = require("../modules/resource/resource.routes");

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
router.use("/", resourceRoutes);

module.exports = router;
