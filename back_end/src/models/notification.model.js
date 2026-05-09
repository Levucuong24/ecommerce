const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    message: String,
    isRead: { type: Boolean, default: false },
    createdAt: Date,
  },
  { versionKey: false }
);

module.exports = mongoose.model("Notification", notificationSchema);
