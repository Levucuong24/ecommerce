const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    color: { type: String },
    priceSnapshot: Number,
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [cartItemSchema],
    updatedAt: Date,
  },
  { versionKey: false }
);

module.exports = mongoose.model("Cart", cartSchema);
