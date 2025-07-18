const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  areas: {
    type: [String],
    default: [],
  },

  vehicleType: {
    type: String,
    enum: ["bike", "car", "van", "cycle", "walk"],
    default: "bike",
  },

  agentStatus: {
    type: String,
    enum: ["available", "busy", "offline"],
    default: "available",
  },
  currentParcels: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parcel",
    }
  ],

  currentLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },

  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },

  experienceInYears: {
    type: Number,
    default: 0,
  },

  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Agent", agentSchema);
