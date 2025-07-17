const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const addressSchema = new mongoose.Schema({
  country: { type: String, trim: true },
  district: { type: String, trim: true },
  streetAddress: { type: String, trim: true },
  zipCode: { type: String, trim: true },
});

const userSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: [true, "Please provide your name"],
      minlength: [3, "Name must be at least 3 characters."],
      maxlength: [100, "Name is too large"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      validate: [validator.isEmail, "Provide a valid Email"],
      trim: true,
      unique: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
      validate: [validator.isMobilePhone, "Please provide a valid phone number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    photoURL: {
      type: String,
      validate: [validator.isURL, "Please provide a valid url"],
      trim: true,
    },
    firebaseUid: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "deliveryAgent", "customer"],
      default: "customer",
    },
    providerId: {
      type: String,
      enum: ["google.com", "password", "facebook.com"],
      default: "password",
    },
    IPAddress: {
      type: [String],
      default: [],
    },
    loginDevices: [
      {
        type: Object,
      },
    ],
    presentAddress: addressSchema,
    permanentAddress: addressSchema,
    NID: { type: String, trim: true },
    dateOfBirth: { type: Date },
    postalCode: { type: String, trim: true },
    drivingLicense: { type: String, trim: true },// Delivery Agent specific
    vehicleInfo: {
      type: {
        vehicleType: String,
        vehicleNumber: String,
      },
      default: undefined,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // Token related fields
    confirmationToken: String,
    confirmationTokenExpires: Date,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  this.password = bcrypt.hashSync(this.password, 12);
  next();
});

// Password compare method
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password);
};

// Generate confirmation token
userSchema.methods.generateConfirmationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.confirmationToken = token;
  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + 1);
  this.confirmationTokenExpires = expireDate;
  return token;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
