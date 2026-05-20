const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    code: { type: String, required: true, unique: true },
    discountType: String,
    value: Number,
    minOrder: { type: Number, default: 0 },
    maxUsage: Number,
    expiredAt: Date,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isActive: { type: Boolean, default: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Coupon", couponSchema);
