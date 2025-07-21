const {  markReadNotificationService, getNotificationsService } = require("../services/notificationService");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const notifications = await getNotificationsService(userId, role);
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.markReadNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.id;
    await markReadNotificationService(notificationId, userId);
    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.readAllNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const notifications = await getNotificationsService(userId, role);

    await Promise.all(
      notifications.map(notification =>
        markReadNotificationService(notification._id, userId)
      )
    );
    
    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};
