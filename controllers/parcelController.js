const Parcel = require("../models/Parcel");
const mongoose = require("mongoose");
const parcelService = require("../services/parcelServices");
const Agent = require("../models/Agent");
const User = require("../models/User");

// Create a new parcel booking (Customer)
exports.createParcel = async (req, res) => {
  try {
    const userId = req.user.userId;
    const parcel = await parcelService.createParcelService(req.body, userId);

    const io = req.app.get("socketio");
    io.to("admins").emit("new_notification", {
      title: "New Parcel Booking",
      description: "A new parcel has been booked.",
      targetId: parcel._id,
      type: "new_parcel",
    });

    res.status(201).json({
      success: true,
      message: "Parcel booking created successfully",
      parcel,
    });
  } catch (error) {
    console.error("Error in createParcel:", error.message);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create parcel",
    });
  }
};

// Get all parcels (Admin)
exports.getAllParcels = async (req, res) => {
 try {
    const parcels = await parcelService.getAllParcelsService();
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all parcels By Status (delivaryAgent, Admin)
exports.getDeliveredParcelsByStatus = async (req, res) => {
try {
    const status = req.params.status;
    const parcels = await parcelService.getDeliveredParcelsByStatusService(status);
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get new parcels (Admin)
exports.getNewParcels = async (req, res) => {
 try {
    const parcels = await parcelService.getNewParcelsService();
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyParcels = async (req, res) => {
  try {
    const userId = req.user.userId;
    const parcels = await parcelService.getMyParcelsService(userId);
    res.json(parcels);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

exports.getAssignedParcels = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const parcels = await parcelService.getAssignedParcelsService(agentId);
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getParcelById = async (req, res) => {
  try {
    const parcelId = req.params.id;
    const parcel = await parcelService.getParcelByIdService(parcelId);
    res.json(parcel);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

exports.updateParcelStatus = async (req, res) => {
  try {
    const parcelId = req.params.id;
    const { status, location, message, customStatus } = req.body;
    const currentUserId = req.user.userId;

    const parcel = await parcelService.updateParcelStatusService(
      parcelId,
      status,
      currentUserId,
      message,
      location,
      customStatus
    );

    res.json({ success: true, message: "Parcel status updated", parcel });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

exports.assignAgent = async (req, res) => {
  try {
    const parcelId = req.params.id;
    const { agentId } = req.body;

    const parcel = await parcelService.assignAgentService(parcelId, agentId);

    res.json({ message: "Agent assigned successfully", parcel });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};


exports.multipleAssignParcel = async (req, res) => {
  try {
    const { parcelIds, agentId } = req.body;

    const result = await parcelService.multipleAssignParcelService(
      parcelIds,
      agentId
    );

    res.json({
      success: true,
      message: "Agent assigned to selected parcels successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      message: error.message || "Server error",
    });
  }
};

exports.deleteParcel = async (req, res) => {
  try {
    const parcelId = req.params.id;
    await parcelService.deleteParcelService(parcelId);
    res.json({ message: "Parcel deleted successfully" });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

exports.trackParcel = async (req, res) => {
  try {
    const parcelId = req.params.id;
    const trackingInfo = await parcelService.trackParcelService(parcelId);
    res.json(trackingInfo);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

exports.updateParcelLocation = async (req, res) => {
  try {
    const parcelId = req.params.id;
    const { lat, lng } = req.body;
    const userId = req.user.userId;

    const updatedCoordinates = await parcelService.updateParcelLocationService(parcelId, lat, lng, userId);

    res.json({
      message: "Location updated",
      trackingCoordinates: updatedCoordinates,
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

exports.cancelParcel = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;

    const parcel = await parcelService.cancelParcelByIdService(
      id,
      reason,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Parcel cancelled successfully",
      parcel,
    });
  } catch (error) {
    console.error("Cancel Parcel Error:", error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
