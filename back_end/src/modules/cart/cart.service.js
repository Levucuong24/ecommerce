const mongoose = require("mongoose");
const Cart = require("../../models/cart.model");

const addToCart = async (userId, productId, quantity, replace = false) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({
      _id: new mongoose.Types.ObjectId(),
      userId,
      items: [],
      updatedAt: new Date()
    });
  }

  const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
  if (itemIndex > -1) {
    if (replace) {
      cart.items[itemIndex].quantity = quantity;
    } else {
      cart.items[itemIndex].quantity += quantity;
    }
  } else {
    cart.items.push({ productId, quantity });
  }

  cart.updatedAt = new Date();
  await cart.save();
  return cart.populate("items.productId");
};

const getMyCart = async (userId) => {
  return Cart.findOne({ userId }).populate("items.productId");
};

const removeFromCart = async (userId, productId) => {
  const cart = await Cart.findOne({ userId });
  if (cart) {
    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    cart.updatedAt = new Date();
    await cart.save();
  }
  return cart.populate("items.productId");
};

module.exports = {
  addToCart,
  getMyCart,
  removeFromCart,
};
