const asyncHandler = require("../../middleware/asyncHandler");
const chatService = require("./chat.service");

const getMessages = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { customerId } = req.query; // Used if staff is fetching a customer's chat
  const messages = await chatService.getMessages(req.user.id, storeId, customerId);
  res.json(messages);
});

const sendMessage = asyncHandler(async (req, res) => {
  const { storeId, content, receiverId, senderRole } = req.body;
  const message = await chatService.sendMessage(req.user.id, storeId, receiverId, senderRole, content);
  res.status(201).json(message);
});

const getStoreConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.getStoreConversations(req.user.id);
  res.json(conversations);
});

module.exports = {
  getMessages,
  sendMessage,
  getStoreConversations,
};
