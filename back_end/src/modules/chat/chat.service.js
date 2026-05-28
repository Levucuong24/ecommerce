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

  const uniqueStoreIds = Array.from(new Set(Array.from(conversationMap.values()).map(c => c.storeId)));
  const uniqueCustomerIds = Array.from(new Set(Array.from(conversationMap.values()).map(c => c.customerId)));

  const [storesList, customersList] = await Promise.all([
    Store.find({ _id: { $in: uniqueStoreIds } }).select("name logo"),
    User.find({ _id: { $in: uniqueCustomerIds } }).select("name email avatar")
  ]);

  const storeMap = new Map(storesList.map(s => [s._id.toString(), s]));
  const customerMap = new Map(customersList.map(c => [c._id.toString(), c]));

  const conversations = [];
  for (const conv of conversationMap.values()) {
    const store = storeMap.get(conv.storeId.toString());
    const customer = customerMap.get(conv.customerId.toString());
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

const getUserConversations = async (userId) => {
  const currentUserId = userId.toString();

  const messages = await ChatMessage.find({
    $or: [
      { senderId: currentUserId },
      { receiverId: currentUserId }
    ]
  }).sort({ createdAt: -1 });

  const conversationMap = new Map();

  for (const msg of messages) {
    const storeIdStr = msg.storeId.toString();

    if (!conversationMap.has(storeIdStr)) {
      conversationMap.set(storeIdStr, {
        storeId: msg.storeId,
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt,
        senderRole: msg.senderRole,
      });
    }
  }

  const uniqueStoreIds = Array.from(new Set(Array.from(conversationMap.values()).map(c => c.storeId)));
  const storesList = await Store.find({ _id: { $in: uniqueStoreIds } }).select("name logo ownerId");
  const storeMap = new Map(storesList.map(s => [s._id.toString(), s]));

  const conversations = [];
  for (const conv of conversationMap.values()) {
    const store = storeMap.get(conv.storeId.toString());
    if (store) {
      conversations.push({
        ...conv,
        storeName: store.name,
        storeLogo: store.logo,
        storeOwnerId: store.ownerId,
      });
    }
  }

  return conversations;
};

module.exports = {
  getMessages,
  sendMessage,
  getStoreConversations,
  getUserConversations,
};

