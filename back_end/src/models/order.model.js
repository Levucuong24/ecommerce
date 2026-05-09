const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    image: String,
    price: Number,
    quantity: Number,
  },
  { _id: false }
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    detail: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    addressSnapshot: addressSnapshotSchema,
    totalPrice: Number,
    paymentMethod: String,
    paymentStatus: String,
    orderStatus: String,
    createdAt: Date,
  },
  { versionKey: false }
);

module.exports = mongoose.model("Order", orderSchema);
