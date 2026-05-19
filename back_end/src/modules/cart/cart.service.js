const mongoose = require("mongoose");
const Cart = require("../../models/cart.model");

const addToCart = async (userId, productId, quantity, replace = false, color = null) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({
      _id: new mongoose.Types.ObjectId(),
      userId,
      items: [],
      updatedAt: new Date()
    });
  }

  const itemIndex = cart.items.findIndex(
    item => item.productId.toString() === productId && item.color === (color || null)
  );
  if (itemIndex > -1) {
    if (replace) {
      cart.items[itemIndex].quantity = quantity;
    } else {
      cart.items[itemIndex].quantity += quantity;
    }
  } else {
    cart.items.push({ productId, quantity, color: color || null });
  }

  cart.updatedAt = new Date();
  await cart.save();
  return cart.populate("items.productId");
};

const getMyCart = async (userId) => {
  return Cart.findOne({ userId }).populate("items.productId");
};

const removeFromCart = async (userId, productId, color = null) => {
  const cart = await Cart.findOne({ userId });
  if (cart) {
    cart.items = cart.items.filter(
      item => !(item.productId.toString() === productId && item.color === (color || null))
    );
    cart.updatedAt = new Date();
    await cart.save();
  }
  return cart.populate("items.productId");
};

const clearCart = async (userId) => {
  const cart = await Cart.findOne({ userId });
  if (cart) {
    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();
  }
  return cart;
};

module.exports = {
  addToCart,
  getMyCart,
  removeFromCart,
  clearCart,
};
