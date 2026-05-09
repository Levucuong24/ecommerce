const { Review } = require("../models");
const asyncHandler = require("../middleware/asyncHandler");
const { listResources, getResourceById } = require("../services/resource.service");

const getReviews = asyncHandler(async (req, res) => {
    const data = await listResources(Review, req.query);
    res.json(data);
});

const getReviewById = asyncHandler(async (req, res) => {
    const data = await getResourceById(Review, req.params.id);
    res.json(data);
});

module.exports = {
  getReviews,
  getReviewById,
};
