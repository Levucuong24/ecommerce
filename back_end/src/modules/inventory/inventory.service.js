const mongoose = require("mongoose");
const { InventoryReceipt, Product } = require("../../models");

const generateReceiptCode = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PNK-${dateStr}-${randomSuffix}`;
};

const createReceipt = async (userId, user, data) => {
  const { productId, quantity, importPrice, supplier, note, proofImage } = data;

  if (!productId || !quantity || quantity <= 0) {
    const error = new Error("Thông tin sản phẩm và số lượng nhập không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error("Sản phẩm không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  const numQty = Number(quantity);
  const numPrice = Number(importPrice) || Number(product.price) || 0;
  const totalPrice = numQty * numPrice;
  const receiptCode = generateReceiptCode();

  // Create Receipt Record with pending_approval status (DO NOT increase stock yet)
  const receipt = await InventoryReceipt.create({
    _id: new mongoose.Types.ObjectId(),
    receiptCode,
    productId: product._id,
    productName: product.name,
    quantity: numQty,
    importPrice: numPrice,
    totalPrice,
    supplier: supplier || "Nhà cung cấp chính",
    note: note || "",
    proofImage: proofImage || "",
    status: "pending_approval",
    createdBy: userId,
    createdByName: user?.name || "Quản lý kho",
    createdAt: new Date(),
  });

  return { receipt, message: "Đã gửi yêu cầu nhập kho thành công! Vui lòng chờ Admin phê duyệt." };
};

const approveReceipt = async (receiptId, adminUser) => {
  const receipt = await InventoryReceipt.findById(receiptId);
  if (!receipt) {
    const error = new Error("Biên lai không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  if (receipt.status === "approved") {
    const error = new Error("Biên lai này đã được duyệt trước đó");
    error.statusCode = 400;
    throw error;
  }

  // Find product and update stock
  const product = await Product.findById(receipt.productId);
  if (!product) {
    const error = new Error("Sản phẩm liên quan không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  // Increment stock in MongoDB
  product.stock = (product.stock || 0) + receipt.quantity;
  await product.save();

  // Update receipt status
  receipt.status = "approved";
  receipt.approvedBy = adminUser.id || adminUser._id;
  receipt.approvedByName = adminUser.name || "Quản trị viên";
  receipt.approvedAt = new Date();
  await receipt.save();

  return { receipt, updatedStock: product.stock };
};

const rejectReceipt = async (receiptId, adminUser, reason) => {
  const receipt = await InventoryReceipt.findById(receiptId);
  if (!receipt) {
    const error = new Error("Biên lai không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  receipt.status = "rejected";
  receipt.rejectReason = reason || "Không đạt yêu cầu kiểm kho";
  receipt.approvedBy = adminUser.id || adminUser._id;
  receipt.approvedByName = adminUser.name || "Quản trị viên";
  receipt.approvedAt = new Date();
  await receipt.save();

  return receipt;
};

const getReceipts = async (query = {}) => {
  const filter = {};
  if (query.productId) {
    filter.productId = query.productId;
  }
  if (query.status) {
    filter.status = query.status;
  }

  const receipts = await InventoryReceipt.find(filter)
    .populate("productId", "name image images price stock")
    .sort({ createdAt: -1 });

  return receipts;
};

module.exports = {
  createReceipt,
  approveReceipt,
  rejectReceipt,
  getReceipts,
};
