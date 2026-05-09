const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    provider: String,
    transactionId: String,
    amount: Number,
    status: String,
    paidAt: Date,
  },
  { versionKey: false }
);

module.exports = mongoose.model("Payment", paymentSchema);
