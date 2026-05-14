const asyncHandler = require("../../middleware/asyncHandler");
const notificationService = require("./notification.service");

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.getNotifications(req.user.id);
  res.json(notifications);
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id);
  res.json(notification);
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  res.json({ message: "All notifications marked as read" });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
