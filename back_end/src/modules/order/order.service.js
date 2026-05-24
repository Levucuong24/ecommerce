const mongoose = require("mongoose");
const Order = require("../../models/order.model");
const Cart = require("../../models/cart.model");
const Product = require("../../models/product.model");
const Store = require("../../models/store.model");
const Coupon = require("../../models/coupon.model");
const { listResources, getResourceById } = require("../resource/resource.service");

const getOrders = async (query) => listResources(Order, query);

const getOrderById = async (id) => getResourceById(Order, id);

const getMyOrders = async (userId) => {
  return Order.find({ userId }).populate("storeId").sort({ createdAt: -1 });
};

const getStoreOrders = async (userId) => {
  const store = await Store.findOne({ ownerId: userId });
  if (!store) return [];
  return Order.find({ storeId: store._id }).populate("userId").sort({ createdAt: -1 });
};

const createOrder = async (userId, addressSnapshot, paymentMethod, selectedVoucherId) => {
  const cart = await Cart.findOne({ userId }).populate("items.productId");
  if (!cart || cart.items.length === 0) {
    const error = new Error("Giỏ hàng của bạn đang trống");
    error.statusCode = 400;
    throw error;
  }

  // Group items by storeId
  const storeGroups = {};
  for (const item of cart.items) {
    const product = item.productId;
    if (!product) continue;
    
    // Ensure product is published and in stock
    const storeId = product.storeId ? product.storeId.toString() : null;
    if (!storeId) continue;

    if (!storeGroups[storeId]) {
      storeGroups[storeId] = [];
    }
    storeGroups[storeId].push(item);
  }

  if (Object.keys(storeGroups).length === 0) {
    const error = new Error("Sản phẩm trong giỏ hàng không thuộc về cửa hàng nào hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  // Deduct stock and calculate subtotals
  let overallSubtotal = 0;
  const storeSubtotals = {};

  for (const storeId in storeGroups) {
    let storeSubtotal = 0;
    for (const item of storeGroups[storeId]) {
      const product = await Product.findById(item.productId._id);
      if (!product) {
        throw new Error("Không tìm thấy sản phẩm trong hệ thống");
      }

      let price = product.price;
      if (item.color) {
        const colorObj = product.colors.find(c => c.name === item.color);
        if (!colorObj) {
          throw new Error(`Không tìm thấy phân loại màu ${item.color} của sản phẩm ${product.name}`);
        }
        if (colorObj.stock < item.quantity) {
          throw new Error(`Sản phẩm ${product.name} (Phân loại: ${item.color}) không đủ hàng tồn kho`);
        }
        colorObj.stock -= item.quantity;
        price = colorObj.discountPrice || colorObj.price;
      } else {
        if (product.stock < item.quantity) {
          throw new Error(`Sản phẩm ${product.name} không đủ hàng tồn kho`);
        }
        product.stock -= item.quantity;
        price = product.discountPrice || product.price;
      }

      product.soldCount = (product.soldCount || 0) + item.quantity;
      await product.save();

      storeSubtotal += price * item.quantity;
    }
    storeSubtotals[storeId] = storeSubtotal;
    overallSubtotal += storeSubtotal;
  }

  // Apply Voucher if present
  let overallDiscount = 0;
  if (selectedVoucherId) {
    const coupon = await Coupon.findById(selectedVoucherId);
    if (coupon && coupon.isActive && (!coupon.expiredAt || new Date(coupon.expiredAt) > new Date())) {
      if (overallSubtotal >= coupon.minOrder) {
        if (coupon.discountType === "percentage" || coupon.type === "percent") {
          const pct = coupon.value || coupon.discountPercent || 0;
          overallDiscount = (overallSubtotal * pct) / 100;
        } else {
          overallDiscount = coupon.value || coupon.discountAmount || 0;
        }
        
        if (overallDiscount > overallSubtotal) {
          overallDiscount = overallSubtotal;
        }

        // Update Coupon usage
        if (coupon.maxUsage !== undefined && coupon.maxUsage !== null) {
          coupon.maxUsage = Math.max(0, coupon.maxUsage - 1);
          if (coupon.maxUsage === 0) {
            coupon.isActive = false;
          }
        }
        await coupon.save();
      }
    }
  }

  const createdOrders = [];
  
  // Create orders split by store
  for (const storeId in storeGroups) {
    const storeSubtotal = storeSubtotals[storeId];
    // Split discount proportionally
    const storeDiscount = overallSubtotal > 0 ? (overallDiscount * storeSubtotal) / overallSubtotal : 0;
    const storeTotalPrice = Math.max(0, Math.round(storeSubtotal - storeDiscount));

    // Admin takes 5% commission from staff's sales
    const commissionRate = 0.05;
    const commissionAmount = Math.round(storeTotalPrice * commissionRate);
    const storeRevenue = storeTotalPrice - commissionAmount;

    const orderItems = storeGroups[storeId].map(item => {
      const product = item.productId;
      let price = product.price;
      let image = product.images?.[0] || "";

      if (item.color) {
        const colorObj = product.colors.find(c => c.name === item.color);
        if (colorObj) {
          price = colorObj.discountPrice || colorObj.price;
          if (colorObj.images?.[0]) {
            image = colorObj.images[0];
          }
        }
      } else {
        price = product.discountPrice || product.price;
      }

      return {
        productId: product._id,
        name: product.name,
        image,
        price,
        quantity: item.quantity,
        color: item.color,
      };
    });

    const newOrder = new Order({
      _id: new mongoose.Types.ObjectId(),
      userId,
      storeId,
      items: orderItems,
      addressSnapshot,
      totalPrice: storeTotalPrice,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "pending",
      orderStatus: "pending",
      commissionRate,
      commissionAmount,
      storeRevenue,
      createdAt: new Date(),
    });

    await newOrder.save();
    createdOrders.push(newOrder);
  }

  // Clear user cart
  cart.items = [];
  cart.updatedAt = new Date();
  await cart.save();

  return createdOrders;
};

const updateOrderStatus = async (orderId, userId, role, status) => {
  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error("Không tìm thấy đơn hàng");
    error.statusCode = 404;
    throw error;
  }

  // If not admin, verify if the user owns the store
  if (role !== "admin") {
    const store = await Store.findOne({ _id: order.storeId, ownerId: userId });
    if (!store) {
      const error = new Error("Bạn không có quyền cập nhật đơn hàng này");
      error.statusCode = 403;
      throw error;
    }
  }

  order.orderStatus = status;
  if (status === "completed") {
    order.paymentStatus = "paid";
  }
  await order.save();
  return order;
};

module.exports = {
  getOrders,
  getOrderById,
  getMyOrders,
  getStoreOrders,
  createOrder,
  updateOrderStatus,
};
