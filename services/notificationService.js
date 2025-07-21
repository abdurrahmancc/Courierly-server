

const Notification = require("../models/Notification");


exports.createNotificationService = async (data) => {
  const notification = new Notification(data);
  return await notification.save();
};

exports.getNotificationsService = async (userId, role) => {
  return await Notification.find({
    $and: [
      {
        $or: [
          { userId: userId },         
          { 
            userId: null,             
            receiverRole: role        
          },
        ]
      },
      {
        readBy: { $ne: userId }    
      }
    ]
  }).sort({ createdAt: -1 });
};


exports.markReadNotificationService = async (notificationId, userId) => {
  return await Notification.updateOne(
    { _id: notificationId },
    { $addToSet: { readBy: userId }, isRead: true }
  );
};
