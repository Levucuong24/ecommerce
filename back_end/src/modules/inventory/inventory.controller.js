const asyncHandler = require("../../middleware/asyncHandler");
const inventoryService = require("./inventory.service");

const createReceipt = asyncHandler(async (req, res) => {
  const result = await inventoryService.createReceipt(req.user.id, req.user, req.body);
  res.status(201).json(result);
});

const approveReceipt = asyncHandler(async (req, res) => {
  const result = await inventoryService.approveReceipt(req.params.id, req.user);
  res.json(result);
});

const rejectReceipt = asyncHandler(async (req, res) => {
  const result = await inventoryService.rejectReceipt(req.params.id, req.user, req.body.reason);
  res.json(result);
});

const getReceipts = asyncHandler(async (req, res) => {
  const receipts = await inventoryService.getReceipts(req.query);
  res.json(receipts);
});

module.exports = {
  createReceipt,
  approveReceipt,
  rejectReceipt,
  getReceipts,
};
