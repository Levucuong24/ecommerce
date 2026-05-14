const mongoose = require("mongoose");
const { Notification, Store } = require("../../models");

const getNotifications = async (userId) => {
  return await Notification.find({ userId }).sort({ createdAt: -1 });
};

const markAsRead = async (notificationId) => {
  return await Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true },
    { new: true }
  );
};

const markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );
};

const createFollowerNotifications = async (storeId, product) => {
  try {
    const store = await Store.findById(storeId);
    if (!store || !store.followers || store.followers.length === 0) {
      return;
    }

    const title = `Sản phẩm mới từ ${store.name}`;
    const message = `${store.name} vừa đăng bán sản phẩm mới: ${product.name}`;

    const notifications = store.followers.map((followerId) => ({
      _id: new mongoose.Types.ObjectId(),
      userId: followerId,
      title,
      message,
      createdAt: new Date(),
      isRead: false,
    }));

    await Notification.insertMany(notifications);
    console.log(`Đã tạo ${notifications.length} thông báo cho người theo dõi shop ${store.name}`);
  } catch (error) {
    console.error("Lỗi khi tạo thông báo cho người theo dõi:", error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createFollowerNotifications,
};
