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
  createResourceHandler,
} = require("./resource.controller");

const upload = require("../../middleware/uploadMiddleware");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const router = express.Router();

router.post("/upload", protect, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload an image" });
  }
  
  const protocol = req.protocol;
  const host = req.get("host");
  const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  
  res.json({
    url: imageUrl,
    filename: req.file.filename
  });
});

router.get("/addresses", createListHandler(Address));
router.get("/addresses/:id", createDetailHandler(Address));

router.get("/categories", createListHandler(Category));
router.get("/categories/:id", createDetailHandler(Category));
router.post("/categories", protect, authorize("admin"), createResourceHandler(Category));

router.get("/payments", createListHandler(Payment));
router.get("/payments/:id", createDetailHandler(Payment));

router.get("/wishlist", createListHandler(Wishlist));
router.get("/wishlist/:id", createDetailHandler(Wishlist));

router.get("/coupons", createListHandler(Coupon));
router.get("/coupons/:id", createDetailHandler(Coupon));

router.get("/notifications", createListHandler(Notification));
router.get("/notifications/:id", createDetailHandler(Notification));

module.exports = router;
