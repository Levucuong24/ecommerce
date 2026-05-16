const { Product, Store } = require("../../models");
const { listResources, getResourceById } = require("../resource/resource.service");
const notificationService = require("../notification/notification.service");
const slugify = require("../../utils/slugify");
const mongoose = require("mongoose");

const getProducts = async (query) => listResources(Product, query, "categoryId");

const getProductById = async (id) => {
  const product = await Product.findById(id)
    .populate("createdBy", "name avatar createdAt")
    .populate("categoryId");
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }
  let shopData = {
    name: product.createdBy?.name || "Shop Name",
    avatar: product.createdBy?.avatar,
    joinedAt: product.createdBy?.createdAt,
    responseTime: "trong vài giờ",
    responseRate: "99%",
    followerCount: 0,
    followers: [],
    totalProducts: 0,
    totalRatings: 0,
    avgRating: 0,
  };

  if (product.storeId) {
    const store = await Store.findById(product.storeId);
    if (store) {
      const [totalProducts, stats] = await Promise.all([
        Product.countDocuments({ storeId: store._id }),
        Product.aggregate([
          { $match: { storeId: store._id } },
          { $group: { _id: null, totalRatings: { $sum: "$ratingCount" }, avgRating: { $avg: "$ratingAverage" } } }
        ])
      ]);

      shopData = {
        _id: store._id,
        name: store.name,
        avatar: store.logo || product.createdBy?.avatar,
        joinedAt: store.createdAt,
        followerCount: store.followerCount || 0,
        followers: store.followers || [],
        totalProducts,
        totalRatings: stats[0]?.totalRatings || 0,
        avgRating: stats[0]?.avgRating || 0,
        isOnline: store.isOnline || false,
        lastActive: store.lastActive || store.createdAt,
        responseTime: "trong vài giờ",
        responseRate: "99%",
      };
    }
  }

  const productData = product.toObject();
  productData.shop = shopData;

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

  // Gửi thông báo cho người theo dõi
  if (product.storeId) {
    notificationService.createFollowerNotifications(product.storeId, product);
  }

  return product;
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
};
