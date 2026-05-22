const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    senderRole: { type: String, enum: ["customer", "staff"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
