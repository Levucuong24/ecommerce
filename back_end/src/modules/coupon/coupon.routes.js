const express = require("express");
const couponController = require("./coupon.controller");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const router = express.Router();

// Customer queries applicable coupons for cart checkout
router.get("/applicable", protect, couponController.getApplicableCoupons);

// Shop manager endpoints (restricted to staff role)
router.get("/store", protect, authorize("staff"), couponController.getStoreCoupons);
router.post("/store", protect, authorize("staff"), couponController.createStoreCoupon);
router.delete("/store/:id", protect, authorize("staff"), couponController.deleteStoreCoupon);

module.exports = router;
