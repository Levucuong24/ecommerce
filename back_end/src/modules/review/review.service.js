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

  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(String(productId)) } },
    {
      $group: {
        _id: "$productId",
        ratingCount: { $sum: 1 },
        ratingAverage: { $avg: "$rating" }
      }
    }
  ]);

  if (stats.length > 0) {
    const { ratingCount, ratingAverage } = stats[0];
    await Product.findByIdAndUpdate(productId, {
      ratingAverage: Number(ratingAverage.toFixed(1)),
      ratingCount,
    });
  }

  return review;
};

module.exports = {
  getReviews,
  getReviewById,
  createReview,
};
