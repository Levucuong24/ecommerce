const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    role: { type: String, default: "customer" },
    phone: String,
    avatar: String,
    googleId: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    otpAttempts: { type: Number, default: 0 },
    otpLockUntil: { type: Date, default: null },
    coins: { type: Number, default: 0 },
    lastCheckIn: { type: Date, default: null },
    createdAt: Date,
  },
  { versionKey: false }
);

module.exports = mongoose.model("User", userSchema);
