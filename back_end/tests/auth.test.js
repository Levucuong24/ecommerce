require("dotenv").config();
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const connectDatabase = require("../src/config/db");
const { User } = require("../src/models");
const authService = require("../src/modules/auth/auth.service");

describe("Auth Service Tests", () => {
  let testUser;

  before(async () => {
    // Ensure database connection is active
    if (mongoose.connection.readyState === 0) {
      await connectDatabase();
    }
    
    // Create clean test user
    const email = "auth_test_" + Date.now() + "@gmail.com";
    testUser = await User.create({
      _id: new mongoose.Types.ObjectId(),
      name: "Auth Test User",
      email,
      phone: "0961234567",
      role: "customer",
    });
  });

  after(async () => {
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
    await mongoose.connection.close();
  });

  it("should fail when resetPassword receives an invalid OTP format (NoSQL injection prevention)", async () => {
    // Mock user having a password reset token
    await User.findByIdAndUpdate(testUser._id, {
      resetPasswordToken: "123456",
      resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      otpAttempts: 0,
      otpLockUntil: null
    });

    // Attempt reset password with a query object as OTP (NoSQL Injection payload)
    try {
      await authService.resetPassword(testUser.email, { $ne: null }, "newPassword123");
      assert.fail("Should have thrown an error for injection payload");
    } catch (error) {
      assert.strictEqual(error.message, "Mã OTP không chính xác");
      assert.strictEqual(error.statusCode, 400);
    }
  });

  it("should increment otpAttempts and eventually lock the user out after 5 failures", async () => {
    await User.findByIdAndUpdate(testUser._id, {
      resetPasswordToken: "654321",
      resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
      otpAttempts: 0,
      otpLockUntil: null
    });

    // Make 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      try {
        await authService.resetPassword(testUser.email, "wrong_otp_" + i, "newPass");
      } catch (err) {
        assert.strictEqual(err.message, "Mã OTP không chính xác");
      }
      
      const userState = await User.findById(testUser._id);
      assert.strictEqual(userState.otpAttempts, i);
      assert.strictEqual(userState.otpLockUntil, null);
    }

    // Make the 5th failed attempt -> should lock out
    try {
      await authService.resetPassword(testUser.email, "wrong_otp_5", "newPass");
      assert.fail("Should have failed on 5th attempt");
    } catch (err) {
      assert.ok(err.message.includes("bị khóa"));
      assert.strictEqual(err.statusCode, 423);
    }

    const userState = await User.findById(testUser._id);
    assert.strictEqual(userState.otpAttempts, 0); // resets to 0 on lockout
    assert.ok(userState.otpLockUntil instanceof Date);
    assert.ok(userState.otpLockUntil.getTime() > Date.now());
  });
});
