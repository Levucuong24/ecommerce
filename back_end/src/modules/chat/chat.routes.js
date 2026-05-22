const express = require("express");
const chatController = require("./chat.controller");
const protect = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/conversations", chatController.getStoreConversations);
router.get("/:storeId", chatController.getMessages);
router.post("/", chatController.sendMessage);

module.exports = router;
