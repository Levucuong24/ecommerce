const mongoose = require("mongoose");

const inventoryReceiptSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    receiptCode: { type: String, required: true, unique: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    importPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true },
    supplier: { type: String, default: "Nhà cung cấp chính" },
    note: { type: String, default: "" },
    proofImage: { type: String, default: "" }, // Hình ảnh chứng từ/biên lai/lô hàng đính kèm
    status: {
      type: String,
      enum: ["pending_approval", "approved", "rejected"],
      default: "pending_approval"
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByName: { type: String, default: "Quản lý kho" },
    createdAt: { type: Date, default: Date.now },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedByName: { type: String, default: "" },
    approvedAt: { type: Date, default: null },
    rejectReason: { type: String, default: "" },
  },
  { versionKey: false }
);

module.exports = mongoose.model("InventoryReceipt", inventoryReceiptSchema);
