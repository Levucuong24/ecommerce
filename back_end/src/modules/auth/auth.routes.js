const express = require("express");
const authController = require("./auth.controller");
const protect = require("../../middleware/authMiddleware");

const router = express.Router();

const rateLimit = require("../../middleware/rateLimitMiddleware");

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 yêu cầu từ cùng 1 IP
  message: "Bạn đã yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút."
});

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", protect, authController.me);
router.put("/me", protect, authController.updateProfile);
router.post("/forgot-password", passwordResetLimiter, authController.forgotPassword);
router.post("/reset-password", passwordResetLimiter, authController.resetPassword);
router.post("/google", authController.googleLogin);

module.exports = router;
