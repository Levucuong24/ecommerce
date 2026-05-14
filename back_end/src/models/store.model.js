const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    logo: String,
    banner: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "active", "inactive"], default: "pending" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followerCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Store", storeSchema);
