const { ChatMessage, Store, User } = require("../../models");

const getMessages = async (userId, storeId, otherUserId) => {
  const store = await Store.findById(storeId);
  if (!store) {
    throw new Error("Store not found");
  }

  const storeOwnerId = store.ownerId.toString();
  const currentUserId = userId.toString();

  let targetOtherUserId = otherUserId;
  if (currentUserId === storeOwnerId) {
    if (!targetOtherUserId) {
      throw new Error("Customer ID is required for store owners");
    }
  } else {
    targetOtherUserId = storeOwnerId;
  }

  const messages = await ChatMessage.find({
    storeId,
    $or: [
      { senderId: currentUserId, receiverId: targetOtherUserId },
      { senderId: targetOtherUserId, receiverId: currentUserId }
    ]
  }).sort({ createdAt: 1 });

  return messages;
};

const sendMessage = async (senderId, storeId, otherUserId, senderRole, content) => {
  const store = await Store.findById(storeId);
  if (!store) {
    throw new Error("Store not found");
  }

  const storeOwnerId = store.ownerId.toString();
  const currentUserId = senderId.toString();

  let receiverId = otherUserId;
  if (currentUserId === storeOwnerId) {
    if (!receiverId) {
      throw new Error("Receiver ID is required for store owners");
    }
  } else {
    receiverId = storeOwnerId;
  }

  const message = await ChatMessage.create({
    senderId: currentUserId,
    receiverId,
    storeId,
    senderRole,
    content,
    createdAt: new Date()
  });

  return message;
};

const getStoreConversations = async (userId) => {
  const stores = await Store.find({ ownerId: userId });
  if (stores.length === 0) {
    return [];
  }

  const storeIds = stores.map(s => s._id);

  const messages = await ChatMessage.find({ storeId: { $in: storeIds } })
    .sort({ createdAt: -1 });

  const conversationMap = new Map();

  for (const msg of messages) {
    const isSenderOwner = msg.senderId.toString() === userId.toString();
    const customerId = isSenderOwner ? msg.receiverId.toString() : msg.senderId.toString();
    const key = `${msg.storeId}_${customerId}`;

    if (!conversationMap.has(key)) {
      conversationMap.set(key, {
        storeId: msg.storeId,
        customerId,
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt,
        senderRole: msg.senderRole,
      });
    }
  }

  const conversations = [];
  for (const conv of conversationMap.values()) {
    const store = await Store.findById(conv.storeId).select("name logo");
    const customer = await User.findById(conv.customerId).select("name email avatar");
    if (customer && store) {
      conversations.push({
        ...conv,
        storeName: store.name,
        storeLogo: store.logo,
        customerName: customer.name,
        customerEmail: customer.email,
        customerAvatar: customer.avatar,
      });
    }
  }

  return conversations;
};

module.exports = {
  getMessages,
  sendMessage,
  getStoreConversations,
};
