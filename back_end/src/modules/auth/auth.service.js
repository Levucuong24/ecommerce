const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");

const { User, Coupon } = require("../../models");
const generateToken = require("../../utils/generateToken");
const sendEmail = require("../../utils/sendEmail");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sanitizeUser = (user) => {
  if (!user) return null;

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
};

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

  // Create welcome coupon for new user
  await Coupon.create({
    _id: new mongoose.Types.ObjectId(),
    code: `WELCOME-${user._id.toString().slice(-6).toUpperCase()}`,
    discountType: "percentage",
    value: 17,
    minOrder: 0,
    maxUsage: 1,
    expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    userId: user._id,
    isActive: true,
  });

  return {
    token: generateToken(user),
    user: sanitizeUser(user),
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
    const error = new Error("Email hoặc mật khẩu không chính xác");
    error.statusCode = 401;
    throw error;
  }

  // Ensure user has a welcome coupon (for existing users)
  const welcomeCoupon = await Coupon.findOne({ userId: user._id, code: { $regex: /^WELCOME-/ } });
  if (!welcomeCoupon) {
    await Coupon.create({
      _id: new mongoose.Types.ObjectId(),
      code: `WELCOME-${user._id.toString().slice(-6).toUpperCase()}`,
      discountType: "percentage",
      value: 17,
      minOrder: 0,
      maxUsage: 1,
      expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      userId: user._id,
      isActive: true,
    });
  }

  return {
    token: generateToken(user),
    user: sanitizeUser(user),
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
    const error = new Error("Email là bắt buộc");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("Email không tồn tại trong hệ thống");
    error.statusCode = 404;
    throw error;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetPasswordToken = otp;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

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

const googleLogin = async (credential) => {
  if (!credential) {
    const error = new Error("Credential Google là bắt buộc");
    error.statusCode = 400;
    throw error;
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    // First time login with Google: create new account
    user = await User.create({
      _id: new mongoose.Types.ObjectId(),
      name,
      email,
      password: undefined,
      googleId,
      avatar: picture,
      role: "customer",
      isVerified: true,
      createdAt: new Date(),
    });

    // Create welcome coupon for new user
    await Coupon.create({
      _id: new mongoose.Types.ObjectId(),
      code: `WELCOME-${user._id.toString().slice(-6).toUpperCase()}`,
      discountType: "percentage",
      value: 17,
      minOrder: 0,
      maxUsage: 1,
      expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      userId: user._id,
      isActive: true,
    });
  } else if (!user.googleId) {
    // Existing email account: link Google ID
    user.googleId = googleId;
    if (!user.avatar) user.avatar = picture;
    await user.save();
  }

  return {
    token: generateToken(user),
    user: sanitizeUser(user),
  };
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  googleLogin,
};
