const asyncHandler = require("../../middleware/asyncHandler");
const reviewService = require("../../services/review/review.service");

const getReviews = asyncHandler(async (req, res) => {
    const data = await reviewService.getReviews(req.query);
    res.json(data);
});

const getReviewById = asyncHandler(async (req, res) => {
    const data = await reviewService.getReviewById(req.params.id);
    res.json(data);
});

module.exports = {
  getReviews,
  getReviewById,
};
