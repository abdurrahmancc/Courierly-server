const Parcel = require("../models/Parcel");
const mongoose = require("mongoose");
const parcelService = require("../services/parcelServices");

// Create a new parcel booking (Customer)
exports.createParcel = async (req, res) => {
  try {
    const userId = req.user.userId; // from verifyJWT middleware
    const {
      pickupAddress,
      deliveryAddress,
      parcelType,
      parcelSize,
      isCOD,
      amount,
      receiverName,
      receiverPhone,
    } = req.body;

    // Basic validation (can be expanded)
    if (!pickupAddress || !deliveryAddress || !parcelType || !parcelSize || !receiverName || !receiverPhone) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    if (isCOD && (!amount || amount <= 0)) {
      return res.status(400).json({ message: "Amount must be greater than 0 for COD parcels" });
    }

    const parcel = new Parcel({
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
    });

    await parcel.save();
    res.status(201).json({ success: true, message: "Parcel booking created", parcel });
  } catch (error) {
    console.error("Error creating parcel:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all parcels (Admin)
exports.getAllParcels = async (req, res) => {
  try {
    const parcels = await Parcel.find().populate("userId assignedAgentId", "name email role");
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get parcels for logged-in customer
exports.getMyParcels = async (req, res) => {
  try {
    const userId = req.user.userId;
    const parcels = await Parcel.find({ userId }).populate("assignedAgentId", "name email");
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get parcels assigned to delivery agent
exports.getAssignedParcels = async (req, res) => {
  try {
    const agentId = req.user._id;
    const parcels = await Parcel.find({ assignedAgentId: agentId }).populate("userId", "name email");
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
    const parcel = await Parcel.findById(parcelId).populate("userId assignedAgentId", "name email role");
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }
    // Optional: Add authorization logic to ensure user can view this parcel
    res.json(parcel);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update parcel status (Delivery Agent)
exports.updateParcelStatus = async (req, res) => {
  try {
    const parcelId = req.params.id;
    const { status } = req.body;

    if (!["PickedUp", "InTransit", "Delivered", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const parcel = await Parcel.findById(parcelId);
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    // Optional: check if current user is assigned agent
    if (parcel.assignedAgentId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not assigned to this parcel" });
    }

    parcel.status = status;
    await parcel.save();
    res.json({ message: "Parcel status updated", parcel });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Assign delivery agent to parcel (Admin)
exports.assignAgent = async (req, res) => {
  try {
    const parcelId = req.params.id;
    const { agentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(parcelId) || !mongoose.Types.ObjectId.isValid(agentId)) {
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
    const parcel = await Parcel.findById(parcelId, "trackingCoordinates status");
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
      return res.status(400).json({ message: "Latitude and longitude required" });
    }

    if (!mongoose.Types.ObjectId.isValid(parcelId)) {
      return res.status(400).json({ message: "Invalid parcel ID" });
    }

    const parcel = await Parcel.findById(parcelId);
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    if (parcel.assignedAgentId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not assigned to this parcel" });
    }

    parcel.trackingCoordinates.push({ lat, lng });
    await parcel.save();

    res.json({ message: "Location updated", trackingCoordinates: parcel.trackingCoordinates });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.cancelParcel = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;

    const parcel = await parcelService.cancelParcelByIdService(id, reason, userId);

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
