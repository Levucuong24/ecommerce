const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { User } = require("../models");
const generateToken = require("../utils/generateToken");

const registerUser = async ({ name, email, password, phone }) => {
  if (!name || !email || !password) {
    const error = new Error("name, email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    _id: new mongoose.Types.ObjectId(),
    name,
    email,
    password: hashedPassword,
    phone,
    role: "customer",
    isVerified: false,
    createdAt: new Date(),
  });

  return {
    token: generateToken(user),
    user,
  };
};

const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error("email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const isMatched = await bcrypt.compare(password, user.password);
  if (!isMatched) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  return {
    token: generateToken(user),
    user,
  };
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
