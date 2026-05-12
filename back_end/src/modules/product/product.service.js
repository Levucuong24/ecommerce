const { Product } = require("../../models");
const { listResources, getResourceById } = require("../resource/resource.service");

const getProducts = async (query) => listResources(Product, query);

const getProductById = async (id) => {
  const product = await Product.findById(id).populate("createdBy", "name avatar createdAt");
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }
  
  // Calculate shop stats
  const [totalProducts, stats] = await Promise.all([
    Product.countDocuments({ createdBy: product.createdBy?._id }),
    Product.aggregate([
      { $match: { createdBy: product.createdBy?._id } },
      { $group: { _id: null, totalRatings: { $sum: "$ratingCount" }, avgRating: { $avg: "$ratingAverage" } } }
    ])
  ]);

  const productData = product.toObject();
  productData.shop = {
    name: product.createdBy?.name || "Shop Name",
    avatar: product.createdBy?.avatar,
    totalProducts,
    totalRatings: stats[0]?.totalRatings || 0,
    avgRating: stats[0]?.avgRating || 0,
    joinedAt: product.createdBy?.createdAt,
    responseTime: "trong vài giờ",
    responseRate: "99%",
    followerCount: "15,2k"
  };

  return productData;
};

module.exports = {
  getProducts,
  getProductById,
};
