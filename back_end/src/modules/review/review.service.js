const mongoose = require("mongoose");
const { Review, Product } = require("../../models");
const { listResources, getResourceById } = require("../resource/resource.service");

const getReviews = async (query) => {
  let filter = {};
  if (query.productId) filter.productId = query.productId;
  if (query.userId) filter.userId = query.userId;

  const items = await Review.find(filter)
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
    
  return { items };
};

const getReviewById = async (id) => getResourceById(Review, id);

const createReview = async (userId, data) => {
  const { productId, rating, comment, images } = data;

  const review = await Review.create({
    _id: new mongoose.Types.ObjectId(),
    userId,
    productId,
    rating: Number(rating),
    comment,
    images: images || [],
    createdAt: new Date(),
  });

  const productReviews = await Review.find({ productId });
  const totalReviews = productReviews.length;
  const averageRating =
    productReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  await Product.findByIdAndUpdate(productId, {
    ratingAverage: averageRating.toFixed(1),
    ratingCount: totalReviews,
  });

  return review;
};

module.exports = {
  getReviews,
  getReviewById,
  createReview,
};
