const express = require("express");
const reviewController = require("./review.controller");
const protect = require("../../middleware/authMiddleware");
const upload = require("../../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", reviewController.getReviews);
router.get("/:id", reviewController.getReviewById);
router.post("/", protect, upload.array("images", 5), reviewController.createReview);

module.exports = router;
