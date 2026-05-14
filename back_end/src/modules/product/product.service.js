const { Product, Store } = require("../../models");
const { listResources, getResourceById } = require("../resource/resource.service");
const slugify = require("../../utils/slugify");
const mongoose = require("mongoose");

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

const createProduct = async (userId, productData) => {
  // If user is staff, auto-assign their storeId and check status
  const store = await Store.findOne({ ownerId: userId });
  if (store) {
    if (store.status !== "active") {
      const error = new Error("Cửa hàng của bạn đang chờ duyệt hoặc bị khóa. Không thể thêm sản phẩm.");
      error.statusCode = 403;
      throw error;
    }
    productData.storeId = store._id;
  } else {
    // If user is admin but has no store, they might need to specify storeId or it might be a general product
    // For now, let's assume staff must have a store
    if (!productData.storeId) {
       const error = new Error("Sản phẩm phải thuộc về một cửa hàng.");
       error.statusCode = 400;
       throw error;
    }
  }

  const slug = slugify(productData.name);
  
  const product = await Product.create({
    _id: new mongoose.Types.ObjectId(),
    ...productData,
    slug,
    createdBy: userId,
  });

  return product;
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
};
