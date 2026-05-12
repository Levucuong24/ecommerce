const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { User } = require("../../models");
const generateToken = require("../../utils/generateToken");
const sendEmail = require("../../utils/sendEmail");

const registerUser = async ({ name, email, password, phone }) => {
  if (!name || !email || !password) {
    const error = new Error("Tên, email và mật khẩu là bắt buộc");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("Email đã tồn tại");
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
    const error = new Error("Email và mật khẩu là bắt buộc");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("Email hoặc mật khẩu không chính xác");
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
    const error = new Error("Người dùng không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const forgotPassword = async (email) => {
  if (!email) {
    const error = new Error("email is required");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("Email không tồn tại trong hệ thống");
    error.statusCode = 404;
    throw error;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Set expiration to 15 minutes
  user.resetPasswordToken = otp;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  // Send the OTP via email
  const messageHtml = `
    <h2>Khôi phục mật khẩu</h2>
    <p>Xin chào ${user.name},</p>
    <p>Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản tại Ecommerce Admin.</p>
    <p>Mã OTP của bạn là: <strong style="font-size: 24px; color: #4f46e5;">${otp}</strong></p>
    <p>Mã này sẽ hết hạn sau 15 phút.</p>
    <p>Nếu bạn không yêu cầu việc này, vui lòng bỏ qua email.</p>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: "Mã xác nhận khôi phục mật khẩu",
      html: messageHtml,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    console.error("Email could not be sent:", error);
    const err = new Error("Không thể gửi email. Vui lòng thử lại sau.");
    err.statusCode = 500;
    throw err;
  }

  return {
    message: "OTP đã được gửi tới email của bạn",
  };
};

const resetPassword = async (email, otp, newPassword) => {
  if (!email || !otp || !newPassword) {
    const error = new Error("Email, mã OTP và mật khẩu mới là bắt buộc");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({
    email,
    resetPasswordToken: otp,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    const error = new Error("Mã OTP không hợp lệ hoặc đã hết hạn");
    error.statusCode = 400;
    throw error;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { success: true };
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
};
