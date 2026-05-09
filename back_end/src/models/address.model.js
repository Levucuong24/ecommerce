const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    province: String,
    district: String,
    ward: String,
    detail: String,
    isDefault: { type: Boolean, default: false },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Address", addressSchema);
