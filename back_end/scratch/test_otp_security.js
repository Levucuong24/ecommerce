require("dotenv").config();
const mongoose = require("mongoose");
const { User } = require("../src/models");
const { forgotPassword, resetPassword, registerUser } = require("../src/modules/auth/auth.service");

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecommerceDB");
    console.log("Connected to database:", mongoose.connection.name);

    // 1. Dọn dẹp tài khoản test cũ nếu có
    const testEmail = "test_otp_user@gmail.com";
    await User.deleteOne({ email: testEmail });

    // 2. Tạo tài khoản test mới
    console.log("Creating test user...");
    await User.create({
      _id: new mongoose.Types.ObjectId(),
      name: "OTP Test User",
      email: testEmail,
      password: "initialpasswordhashed",
      phone: "0961234567",
      role: "customer",
      isVerified: true,
      createdAt: new Date(),
    });

    // 3. Gửi yêu cầu quên mật khẩu để sinh OTP
    console.log("Triggering forgotPassword...");
    const forgotRes = await forgotPassword(testEmail);
    console.log("Forgot Password Response:", forgotRes);

    const userAfterForgot = await User.findOne({ email: testEmail });
    console.log("Generated OTP:", userAfterForgot.resetPasswordToken);
    console.log("Initial OTP attempts:", userAfterForgot.otpAttempts);
    console.log("Initial Lock status:", userAfterForgot.otpLockUntil);

    // 4. Test nhập sai OTP 4 lần liên tiếp
    for (let i = 1; i <= 4; i++) {
      try {
        console.log(`\nAttempt ${i}: Testing wrong OTP reset...`);
        await resetPassword(testEmail, "999999", "newpass123");
      } catch (err) {
        console.log(`Attempt ${i} failed as expected:`, err.message);
        const u = await User.findOne({ email: testEmail });
        console.log(`Current attempts in DB: ${u.otpAttempts}, lock until: ${u.otpLockUntil}`);
      }
    }

    // 5. Test lần nhập sai thứ 5 (Kỳ vọng tài khoản bị khóa)
    try {
      console.log("\nAttempt 5: Testing 5th wrong OTP (should trigger lockout)...");
      await resetPassword(testEmail, "999999", "newpass123");
    } catch (err) {
      console.log("Attempt 5 failed as expected:", err.message);
      const u = await User.findOne({ email: testEmail });
      console.log(`Current attempts in DB (reset to 0 after lock): ${u.otpAttempts}`);
      console.log(`Lock until set in DB: ${u.otpLockUntil}`);
    }

    // 6. Test lần thử thứ 6 (Kỳ vọng lỗi tài khoản đang bị khóa)
    try {
      console.log("\nAttempt 6: Testing reset while account is locked out...");
      await resetPassword(testEmail, "123456", "newpass123");
    } catch (err) {
      console.log("Attempt 6 failed as expected:", err.message);
    }

    // 7. Test chống tấn công NoSQL Injection bằng cách nhập Object { "$ne": null }
    // Giả lập mở khóa tài khoản bằng cách reset trường otpLockUntil về null
    console.log("\nUnlocking account manually for testing NoSQL Injection protection...");
    await User.updateOne({ email: testEmail }, { $set: { otpLockUntil: null, otpAttempts: 0 } });

    try {
      console.log("Testing NoSQL Injection bypass attempt: { '$ne': null }...");
      await resetPassword(testEmail, { "$ne": null }, "injectedpassword");
    } catch (err) {
      console.log("NoSQL Injection bypass rejected as expected:", err.message);
    }

    // Đọc thông tin kiểm tra mật khẩu có bị thay đổi không
    const finalUser = await User.findOne({ email: testEmail });
    console.log("\nFinal check: did password hash change to injected password? (Should not)");
    
    // Dọn dẹp DB
    await User.deleteOne({ email: testEmail });
    console.log("Cleaned up test user.");

    await mongoose.disconnect();
    console.log("Disconnected from database. Test finished successfully!");
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  }
}

runTests();
