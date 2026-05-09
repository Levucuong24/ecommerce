const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  { versionKey: false }
);

module.exports = mongoose.model("Wishlist", wishlistSchema);
