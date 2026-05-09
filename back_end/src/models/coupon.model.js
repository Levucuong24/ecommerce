const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    code: { type: String, required: true, unique: true },
    discountType: String,
    value: Number,
    maxUsage: Number,
    expiredAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Coupon", couponSchema);
