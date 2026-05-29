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
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
    limitPerUser: { type: Number, default: 1 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    isActive: { type: Boolean, default: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Coupon", couponSchema);
