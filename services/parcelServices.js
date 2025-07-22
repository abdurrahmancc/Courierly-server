const Parcel = require("../models/Parcel");
const parcelDao = require("../daos/parcelDao");
const notificationDao = require("../daos/notificationDao");
const Notification = require("../models/Notification");
const Agent = require("../models/Agent");
const mongoose = require("mongoose");
const User = require("../models/User");

exports.createParcelService = async (parcelData, userId) => {
  const {
    pickupAddress,
    deliveryAddress,
    parcelType,
    parcelSize,
    isCOD,
    amount,
    receiverName,
    receiverPhone,
  } = parcelData;

  if (
    !pickupAddress ||
    !deliveryAddress ||
    !parcelType ||
    !parcelSize ||
    !receiverName ||
    !receiverPhone
  ) {
    throw new Error("Please fill all required fields.");
  }

  if (isCOD && (!amount || amount <= 0)) {
    throw new Error("Amount must be greater than 0 for COD parcels.");
  }

  const newParcel = await parcelDao.createParcel({
    userId,
    pickupAddress,
    deliveryAddress,
    parcelType,
    parcelSize,
    isCOD,
    amount: isCOD ? amount : 0,
    receiverName,
    receiverPhone,
    status: "Pending",
    trackingLogs: {
      customStatus: "Order Processing",
      message: `Order received`,
      location: "",
      timestamp: new Date(),
    },
  });

  await notificationDao.createNotification({
    title: "New Parcel Booking",
    description: `A new parcel was booked by a customer.`,
    type: "new_parcel",
    receiverRole: "admin",
    sendToAll: true,
    targetId: newParcel._id,
  });

  return newParcel;
};

exports.getAllParcelsService = async () => {
  const parcels = await Parcel.find()
    .populate("userId assignedAgentId", "name email role")
    .sort("-createdAt");
  return parcels;
};

exports.getDeliveredParcelsByStatusService = async (status) => {
  return await Parcel.find({ status }).sort("-createdAt");
};

exports.getNewParcelsService = async () => {
  return await Parcel.find({ isAssigned: false });
};

exports.cancelParcelByIdService = async (parcelId, reason, userId = null) => {
  if (!reason || reason.trim() === "") {
    throw new Error("Cancel reason is required");
  }

  const parcel = await Parcel.findById(parcelId);

  if (!parcel) {
    const error = new Error("Parcel not found");
    error.statusCode = 404;
    throw error;
  }

  // Optional: only allow owner to cancel
  if (userId && parcel.userId.toString() !== userId) {
    const error = new Error("Unauthorized");
    error.statusCode = 403;
    throw error;
  }

  if (parcel.status === "Failed") {
    const error = new Error("Parcel is already cancelled");
    error.statusCode = 400;
    throw error;
  }

  parcel.status = "Failed";
  parcel.cancelReason = reason;
  await parcel.save();

  return parcel;
};

exports.updateParcelStatusService = async (
  parcelId,
  status,
  currentUserId,
  customMessage,
  currentLocation,
  customStatus
) => {
  const parcel = await Parcel.findById(parcelId);
  const beforeStatus = parcel.status;
  if (!parcel) {
    throw { status: 404, message: "Parcel not found" };
  }

  if (parcel.assignedAgentId?.toString() !== currentUserId.toString()) {
    throw { status: 403, message: "You are not assigned to this parcel" };
  }

  parcel.status = status;

  // Tracking log add
  parcel.trackingLogs.push({
    customStatus: customStatus,
    message: customMessage,
    location: currentLocation,
    timestamp: new Date(),
  });

  await parcel.save();
  if (beforeStatus != status) {
    await Notification.create({
      userId: parcel.userId,
      title: "Parcel Status Updated",
      description: `Your parcel status is now ${status}.`,
      type: "parcel_status_updated",
      targetId: parcelId,
    });
  }

  return parcel;
};

exports.multipleAssignParcelService = async (parcelIds, agentId) => {
  if (
    !Array.isArray(parcelIds) ||
    parcelIds.some((id) => !mongoose.Types.ObjectId.isValid(id)) ||
    !mongoose.Types.ObjectId.isValid(agentId)
  ) {
    throw { status: 400, message: "Invalid parcel IDs or agent ID" };
  }

  const agent = await User.findOne({ _id: agentId, role: "deliveryAgent" });
  if (!agent) {
    throw { status: 400, message: "Invalid delivery agent" };
  }

  const result = await Parcel.updateMany(
    { _id: { $in: parcelIds } },
    { $set: { assignedAgentId: agentId, isAssigned: true } }
  );

  await Agent.updateOne(
    { user: agentId },
    { $addToSet: { currentParcels: { $each: parcelIds } } }
  );

  for (const parcelId of parcelIds) {
    await Notification.create({
      userId: agentId,
      title: "New Parcel Assignment",
      description: `You have been assigned to parcel`,
      type: "new_parcel",
      targetId: parcelId,
    });

    await Parcel.updateOne(
      { _id: parcelId },
      {
        $push: {
          trackingLogs: {
            customStatus: "Assigned to Delivery Agent",
            message: `Assigned to ${agent.displayName || "agent"}`,
            location: "",
            timestamp: new Date(),
          },
        },
      }
    );
  }

  return result;
};

exports.getMyParcelsService = async (userId) => {
  return await Parcel.find({ userId })
    .populate("assignedAgentId", "name email")
    .sort("-updatedAt");
};

exports.getAssignedParcelsService = async (agentId) => {
  return await Parcel.find({ assignedAgentId: agentId }).populate(
    "userId",
    "name email"
  );
};

exports.getParcelByIdService = async (parcelId) => {
  if (!mongoose.Types.ObjectId.isValid(parcelId)) {
    const error = new Error("Invalid parcel ID");
    error.status = 400;
    throw error;
  }

  const parcel = await Parcel.findById(parcelId).populate(
    "userId assignedAgentId",
    "displayName email phoneNumber role"
  );
  if (!parcel) {
    const error = new Error("Parcel not found");
    error.status = 404;
    throw error;
  }
  return parcel;
};


exports.assignAgentService = async (parcelId, agentId) => {
  if (
    !mongoose.Types.ObjectId.isValid(parcelId) ||
    !mongoose.Types.ObjectId.isValid(agentId)
  ) {
    const error = new Error("Invalid parcel or agent ID");
    error.status = 400;
    throw error;
  }

  const parcel = await Parcel.findById(parcelId);
  if (!parcel) {
    const error = new Error("Parcel not found");
    error.status = 404;
    throw error;
  }

  const agent = await User.findOne({ _id: agentId, role: "deliveryAgent" });
  if (!agent) {
    const error = new Error("Invalid delivery agent");
    error.status = 400;
    throw error;
  }

  parcel.assignedAgentId = agentId;
  await parcel.save();

  return parcel;
};

exports.deleteParcelService = async (parcelId) => {
  if (!mongoose.Types.ObjectId.isValid(parcelId)) {
    const error = new Error("Invalid parcel ID");
    error.status = 400;
    throw error;
  }

  const parcel = await Parcel.findByIdAndDelete(parcelId);
  if (!parcel) {
    const error = new Error("Parcel not found");
    error.status = 404;
    throw error;
  }

  return true;
};

exports.trackParcelService = async (parcelId) => {
  if (!mongoose.Types.ObjectId.isValid(parcelId)) {
    const error = new Error("Invalid parcel ID");
    error.status = 400;
    throw error;
  }

  const parcel = await Parcel.findById(parcelId, "trackingCoordinates status");
  if (!parcel) {
    const error = new Error("Parcel not found");
    error.status = 404;
    throw error;
  }

  return {
    status: parcel.status,
    trackingCoordinates: parcel.trackingCoordinates,
  };
};

exports.updateParcelLocationService = async (parcelId, lat, lng, userId) => {
  if (!mongoose.Types.ObjectId.isValid(parcelId)) {
    const error = new Error("Invalid parcel ID");
    error.status = 400;
    throw error;
  }

  if (lat === undefined || lng === undefined) {
    const error = new Error("Latitude and longitude required");
    error.status = 400;
    throw error;
  }

  const parcel = await Parcel.findById(parcelId);
  if (!parcel) {
    const error = new Error("Parcel not found");
    error.status = 404;
    throw error;
  }

  if (parcel.assignedAgentId?.toString() !== userId.toString()) {
    const error = new Error("You are not assigned to this parcel");
    error.status = 403;
    throw error;
  }

  parcel.trackingCoordinates.push({ lat, lng });
  await parcel.save();

  return parcel.trackingCoordinates;
};
