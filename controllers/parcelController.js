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
    const parcels = await Parcel.find()
      .populate("userId assignedAgentId", "name email role")
      .sort("-createdAt");
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all parcels By Status (delivaryAgent, Admin)
exports.getDeliveredParcelsByStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const parcels = await Parcel.find({ status }).sort("-createdAt");
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get new parcels (Admin)
exports.getNewParcels = async (req, res) => {
  try {
    const parcels = await Parcel.find({ isAssigned: false });
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get parcels for logged-in customer
exports.getMyParcels = async (req, res) => {
  try {
    const userId = req.user.userId;
    const parcels = await Parcel.find({ userId }).populate(
      "assignedAgentId",
      "name email"
    );
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get parcels assigned to delivery agent
exports.getAssignedParcels = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const parcels = await Parcel.find({ assignedAgentId: agentId }).populate(
      "userId",
      "name email"
    );
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single parcel by ID (any authorized user)
exports.getParcelById = async (req, res) => {
  try {
    const parcelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(parcelId)) {
      return res.status(400).json({ message: "Invalid parcel ID" });
    }
    const parcel = await Parcel.findById(parcelId).populate(
      "userId assignedAgentId",
      "displayName email phoneNumber role "
    );
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }
    // Optional: Add authorization logic to ensure user can view this parcel
    res.json(parcel);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateParcelStatus = async (req, res) => {
  try {
    const parcelId = req.params.id;
    const { status } = req.body;
    const currentUserId = req.user.userId;

    if (!["PickedUp", "InTransit", "Delivered"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const parcel = await parcelService.updateParcelStatusService(
      parcelId,
      status,
      currentUserId
    );

    res.json({ success: true, message: "Parcel status updated", parcel });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Server error",
    });
  }
};

// Assign delivery agent to parcel (Admin)
exports.assignAgent = async (req, res) => {
  try {
    const parcelId = req.params.id;
    const { agentId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(parcelId) ||
      !mongoose.Types.ObjectId.isValid(agentId)
    ) {
      return res.status(400).json({ message: "Invalid parcel or agent ID" });
    }

    const parcel = await Parcel.findById(parcelId);
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    // Validate agent role (optional, you need User model)
    const User = require("../models/User");
    const agent = await User.findOne({ _id: agentId, role: "deliveryAgent" });
    if (!agent) {
      return res.status(400).json({ message: "Invalid delivery agent" });
    }

    parcel.assignedAgentId = agentId;
    await parcel.save();
    res.json({ message: "Agent assigned successfully", parcel });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Assign delivery agent to multiple parcels (Admin)
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

// Delete parcel (Admin)
exports.deleteParcel = async (req, res) => {
  try {
    const parcelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(parcelId)) {
      return res.status(400).json({ message: "Invalid parcel ID" });
    }

    const parcel = await Parcel.findByIdAndDelete(parcelId);
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    res.json({ message: "Parcel deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get parcel tracking info (Customer)
exports.trackParcel = async (req, res) => {
  try {
    const parcelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(parcelId)) {
      return res.status(400).json({ message: "Invalid parcel ID" });
    }
    const parcel = await Parcel.findById(
      parcelId,
      "trackingCoordinates status"
    );
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }
    res.json({
      status: parcel.status,
      trackingCoordinates: parcel.trackingCoordinates,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update parcel location (Delivery Agent)
exports.updateParcelLocation = async (req, res) => {
  try {
    const parcelId = req.params.id;
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude required" });
    }

    if (!mongoose.Types.ObjectId.isValid(parcelId)) {
      return res.status(400).json({ message: "Invalid parcel ID" });
    }

    const parcel = await Parcel.findById(parcelId);
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    if (parcel.assignedAgentId?.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this parcel" });
    }

    parcel.trackingCoordinates.push({ lat, lng });
    await parcel.save();

    res.json({
      message: "Location updated",
      trackingCoordinates: parcel.trackingCoordinates,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
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
