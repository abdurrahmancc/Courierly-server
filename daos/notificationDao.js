const Notification = require("../models/Notification");

exports.createNotification = async (data) => {
  const notification = new Notification(data);
  return await notification.save();
};
