const { Review } = require("../../models");
const { listResources, getResourceById } = require("../../services/resource/resource.service");

const getReviews = async (query) => listResources(Review, query);

const getReviewById = async (id) => getResourceById(Review, id);

module.exports = {
  getReviews,
  getReviewById,
};
