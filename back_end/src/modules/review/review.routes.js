const express = require("express");
const reviewController = require("./review.controller");
const protect = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/", reviewController.getReviews);
router.get("/:id", reviewController.getReviewById);
router.post("/", protect, reviewController.createReview);

module.exports = router;
