const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    image: String,
    price: Number,
    quantity: Number,
    color: String,
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
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    items: [orderItemSchema],
    addressSnapshot: addressSnapshotSchema,
    totalPrice: Number,
    paymentMethod: { type: String, default: "COD" },
    paymentStatus: { type: String, default: "pending" },
    orderStatus: { type: String, default: "pending" },
    commissionRate: { type: Number, default: 0.05 },
    commissionAmount: { type: Number, default: 0 },
    storeRevenue: { type: Number, default: 0 },
    voucherId: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Order", orderSchema);

