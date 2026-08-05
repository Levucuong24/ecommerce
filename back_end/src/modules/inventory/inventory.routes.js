const express = require("express");
const inventoryController = require("./inventory.controller");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const router = express.Router();

router.post("/receipts", protect, authorize("warehouse", "staff", "admin"), inventoryController.createReceipt);
router.get("/receipts", protect, authorize("warehouse", "staff", "admin"), inventoryController.getReceipts);
router.patch("/receipts/:id/approve", protect, authorize("admin"), inventoryController.approveReceipt);
router.patch("/receipts/:id/reject", protect, authorize("admin"), inventoryController.rejectReceipt);

module.exports = router;
