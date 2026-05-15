const asyncHandler = require("../../middleware/asyncHandler");
const reviewService = require("./review.service");

const getReviews = asyncHandler(async (req, res) => {
    const data = await reviewService.getReviews(req.query);
    res.json(data);
});

const getReviewById = asyncHandler(async (req, res) => {
    const data = await reviewService.getReviewById(req.params.id);
    res.json(data);
});

const createReview = asyncHandler(async (req, res) => {
  const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
  const data = await reviewService.createReview(req.user.id, { ...req.body, images });
  res.status(201).json(data);
});

module.exports = {
  getReviews,
  getReviewById,
  createReview,
};
