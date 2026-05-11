const express = require("express");
const reviewController = require("./review.controller");

const router = express.Router();

router.get("/", reviewController.getReviews);
router.get("/:id", reviewController.getReviewById);

module.exports = router;
