const express = require("express");

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const productRoutes = require("./product.routes");
const cartRoutes = require("./cart.routes");
const orderRoutes = require("./order.routes");
const reviewRoutes = require("./review.routes");
const resourceRoutes = require("./resource.routes");

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
router.use("/", resourceRoutes);

module.exports = router;
