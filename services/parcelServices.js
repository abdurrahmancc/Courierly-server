const Parcel = require("../models/Parcel");


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

  if (parcel.status === "Cancelled") {
    const error = new Error("Parcel is already cancelled");
    error.statusCode = 400;
    throw error;
  }

  parcel.status = "Cancelled";
  parcel.cancelReason = reason;
  await parcel.save();

  return parcel;
};