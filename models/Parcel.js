const mongoose = require("mongoose");

const ParcelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  pickupAddress: {
    type: String,
    required: true,
    trim: true
  },
  deliveryAddress: {
    type: String,
    required: true,
    trim: true
  },
  parcelType: {
    type: String,
    enum: ["Envelope", "Box", "Fragile", "Other"],
    required: true
  },
  parcelSize: {
    type: String,
    enum: ["Small", "Medium", "Large"],
    required: true
  },
  isCOD: {
    type: Boolean,
    default: false
  },
  amount: {
    type: Number,
    default: 0,
    validate: {
      validator: function (value) {
        return !this.isCOD || (this.isCOD && value > 0);
      },
      message: "COD amount must be greater than 0"
    }
  },
  receiverName: {
    type: String,
    required: true,
    trim: true
  },
  receiverPhone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Pending", "PickedUp", "InTransit", "Delivered", "Cancelled"],
    default: "Pending"
  },
  cancelReason: {
    type: String,
    default: ""
  },
  assignedAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  trackingCoordinates: [
    {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto update updatedAt before saving
ParcelSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Parcel", ParcelSchema);
