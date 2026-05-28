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
  if (!name || !email || !password || !phone) {
    const error = new Error("Tên, email, mật khẩu và số điện thoại là bắt buộc");
    error.statusCode = 400;
    throw error;
  }

  if (!email.toLowerCase().endsWith("@gmail.com")) {
    const error = new Error("Email đăng ký phải có đuôi @gmail.com");
    error.statusCode = 400;
    throw error;
  }

  const cleanPhone = phone.trim();
  const allowedPrefixes = [
    "032", "033", "034", "035", "036", "037", "038", "039", 
    "086", "096", "097", "098", 
    "081", "082", "083", "084", "085", "088", "091", "094", 
    "070", "076", "077", "078", "079", "089", "090", "093", 
    "052", "056", "058", "092", "059", "099"
  ];
  const isValid = cleanPhone.length === 10 && allowedPrefixes.some(prefix => cleanPhone.startsWith(prefix)) && /^\d+$/.test(cleanPhone);
  if (!isValid) {
    const error = new Error("Số điện thoại không hợp lệ hoặc không thuộc nhà mạng được hỗ trợ");
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
  user.otpAttempts = 0;
  user.otpLockUntil = null;
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

  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error("Mã OTP không hợp lệ hoặc đã hết hạn");
    error.statusCode = 400;
    throw error;
  }

  // 1. Kiểm tra trạng thái khóa tạm thời
  if (user.otpLockUntil && user.otpLockUntil > Date.now()) {
    const minutesLeft = Math.ceil((new Date(user.otpLockUntil) - Date.now()) / 60000);
    const error = new Error(`Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau ${minutesLeft} phút.`);
    error.statusCode = 423; // Locked
    throw error;
  }

  // 2. Kiểm tra OTP có được tạo chưa và còn hạn không
  if (!user.resetPasswordToken || !user.resetPasswordExpires || user.resetPasswordExpires <= Date.now()) {
    const error = new Error("Mã OTP không hợp lệ hoặc đã hết hạn");
    error.statusCode = 400;
    throw error;
  }

  // 3. So sánh nghiêm ngặt kiểu dữ liệu chuỗi để chặn NoSQL Injection
  if (user.resetPasswordToken !== String(otp).trim()) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    
    if (user.otpAttempts >= 5) {
      user.otpLockUntil = new Date(Date.now() + 15 * 60 * 1000); // Khóa trong 15 phút
      user.otpAttempts = 0;
      await user.save();
      
      const error = new Error("Nhập sai mã OTP quá nhiều lần. Tài khoản của bạn đã bị khóa tạm thời 15 phút.");
      error.statusCode = 423; // Locked
      throw error;
    }
    
    await user.save();
    const error = new Error("Mã OTP không chính xác");
    error.statusCode = 400;
    throw error;
  }

  // 4. Đổi mật khẩu thành công: đặt lại trạng thái OTP
  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.otpAttempts = 0;
  user.otpLockUntil = null;
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
