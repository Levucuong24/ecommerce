const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    rating: { type: Number, required: true },
    comment: String,
    createdAt: Date,
  },
  { versionKey: false }
);

module.exports = mongoose.model("Review", reviewSchema);
