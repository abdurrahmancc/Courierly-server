const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../../middleWares/common/checkLogin");
const { getNotifications, markReadNotification, readAllNotification } = require("../../controllers/notificationController");



// get all notifications for a user
router.get("/", verifyJWT, getNotifications);

// mark a notification as read
router.patch("/:id/read", verifyJWT, markReadNotification);
router.patch("/read-all", verifyJWT, readAllNotification);

module.exports = router;
