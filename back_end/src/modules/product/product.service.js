const { Product, Store } = require("../../models");
const { listResources, getResourceById } = require("../resource/resource.service");
const notificationService = require("../notification/notification.service");
const slugify = require("../../utils/slugify");
const mongoose = require("mongoose");

const deactivateExpiredFlashSales = () => {
  const now = new Date();
  return Product.updateMany(
    {
      isFlashSale: true,
      flashSaleEndTime: { $ne: null, $lt: now },
    },
    {
      $set: { isFlashSale: false, flashSaleDiscountPercent: 0 },
      $unset: { flashSaleStartTime: "", flashSaleEndTime: "" },
    }
  );
};

const getProducts = async (query) => {
  await deactivateExpiredFlashSales();
  return listResources(Product, query, "categoryId");
};

const getProductById = async (id) => {
  await deactivateExpiredFlashSales();
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

  // Nếu có biến thể màu, tính tổng kho và giá thấp nhất từ các màu
  if (productData.colors && productData.colors.length > 0) {
    productData.stock = productData.colors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0);
    // Đặt giá sản phẩm = giá thấp nhất trong các màu (dùng cho tìm kiếm/lọc)
    const prices = productData.colors.map(c => Number(c.price)).filter(p => p > 0);
    if (prices.length > 0) {
      productData.price = Math.min(...prices);
    }
    // Đặt discountPrice = giá khuyến mãi thấp nhất nếu có
    const discountPrices = productData.colors
      .filter(c => c.discountPrice)
      .map(c => Number(c.discountPrice));
    if (discountPrices.length > 0) {
      productData.discountPrice = Math.min(...discountPrices);
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

const toggleFlashSale = async (productId, user, enable, startTime, endTime, flashSaleDiscountPercent) => {
  const product = await Product.findById(productId);

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  // Check ownership if user is staff
  if (user.role === "staff") {
    const store = await Store.findOne({ ownerId: user.id });
    if (!store || (product.storeId && product.storeId.toString() !== store._id.toString())) {
      const error = new Error("Bạn không có quyền quản lý Flash Sale cho sản phẩm này");
      error.statusCode = 403;
      throw error;
    }
  }

  if (enable) {
    const now = new Date();
    const parsedEndTime = endTime ? new Date(endTime) : null;

    if (parsedEndTime && parsedEndTime < now) {
      product.isFlashSale = false;
      product.flashSaleStartTime = null;
      product.flashSaleEndTime = null;
      product.flashSaleDiscountPercent = 0;
    } else {
      product.isFlashSale = true;
      product.flashSaleStartTime = startTime;
      product.flashSaleEndTime = endTime;
      product.flashSaleDiscountPercent = Number(flashSaleDiscountPercent) || 0;
    }
  } else {
    product.isFlashSale = false;
    product.flashSaleStartTime = null;
    product.flashSaleEndTime = null;
    product.flashSaleDiscountPercent = 0;
  }

  const updatedProduct = await product.save();
  return updatedProduct;
};

const toggleLikeProduct = async (productId, userId) => {
  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error("Sản phẩm không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  const userIndex = product.likes.indexOf(userId);
  let isLiked = false;

  if (userIndex === -1) {
    product.likes.push(userId);
    isLiked = true;
  } else {
    product.likes.splice(userIndex, 1);
    isLiked = false;
  }

  product.likeCount = product.likes.length;
  await product.save();

  return { isLiked, likeCount: product.likeCount };
};

const getLikedProducts = async (userId) => {
  const products = await Product.find({ likes: userId }).populate("categoryId");
  return {
    items: products,
    total: products.length,
  };
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  toggleFlashSale,
  toggleLikeProduct,
  getLikedProducts,
  deactivateExpiredFlashSales,
};
