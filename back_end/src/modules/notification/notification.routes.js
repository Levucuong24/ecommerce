const express = require("express");
const notificationController = require("./notification.controller");
const protect = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, notificationController.getNotifications);
router.patch("/mark-all-read", protect, notificationController.markAllAsRead);
router.patch("/:id/read", protect, notificationController.markAsRead);

module.exports = router;
