// external imports
const bcrypt = require("bcrypt");
const { unlink } = require("fs");
const path = require("path");
const parser = require("ua-parser-js");
const jwt = require("jsonwebtoken");
const createError = require("http-errors");

// internal imports
const User = require("../models/User");
const { getUserFromToken } = require("../middleWares/common/checkLogin");
const userService = require("../services/userService");
const Agent = require("../models/Agent");
const mongoose = require("mongoose");

// get all users (admin/moderator access)
const getUsers = async ( req, res, next) => {
  try {
    const users = await User.find();
    res.send({ users });
  } catch (error) {
    next(error);
  }
};

// get all users (admin/moderator access)
const getUserByEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    res.send({ user });
  } catch (error) {
    next(error);
  }
};

// get Delivery Agents (admin/moderator access)
const getDeliveryAgents = async (req, res, next) => {
  try {
    const agents = await userService.getDeliveryAgentsService();
    res.status(200).json({ agents });
  } catch (error) {
    next(error);
  }
};

const getLoginUser = async (req, res, next) => {
  try {
    const getUser = getUserFromToken(req);
    const user = await User.findOne({ email: getUser.email });
    res.send({ user });
  } catch (error) {
    next(error);
  }
};

// get all admins only
const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: "admin" });
    res.send({ users: admins });
  } catch (error) {
    next(createError(401, "Unauthorized Access"));
  }
};

// add a new user
const addUser = async (req, res, next) => {
  try {
    const loginDevices = parser(req.headers["user-agent"]);
    let hashedPassword;

    if (req.body.password) {
      hashedPassword = await bcrypt.hash(req.body.password, 10);
    }

    const userData = {
      ...req.body,
      IPAddress: req.ip,
      loginDevices,
      avatar: req.files?.length ? req.files[0].filename : undefined,
    };

    const newUser = new User(userData);
    await newUser.save();

    // Create JWT token with minimal user info
    const tokenPayload = {
      displayName: newUser.displayName,
      phoneNumber: newUser.phoneNumber,
      email: newUser.email,
      role: newUser.role || "customer",
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });

    res.cookie(process.env.COOKIE_NAME, token, {
      maxAge: parseInt(process.env.JWT_EXPIRY, 10),
      httpOnly: true,
      signed: true,
    });

    res.status(200).send({
      token,
      message: "User was added successfully!",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      errors: { common: { msg: err.message || "Server Error" } },
    });
  }
};

// change user role by admin
const makeRole = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    const { role } = req.body;
    const options = { new: true, useFindAndModify: false, session };

    const updatedUser = await User.findByIdAndUpdate(id, { role }, options);

    if (!updatedUser) {
      await session.abortTransaction();
      return next(createError(404, "User not found"));
    }

    if(role == "deliveryAgent"){
      const newAgent = new Agent({ user: id });
      await newAgent.save({ session });
    }

    await session.commitTransaction();
    res.send({ result: updatedUser, message: "Role updated successfully" });
  } catch (error) {
    await session.abortTransaction();
    next(createError(500, "Server error"));
  } finally {
    session.endSession();
  }
};


// delete user and remove avatar file if exists
const removeUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (user.avatar) {
      const avatarPath = path.join(__dirname, `/../public/uploads/avatars/${user.avatar}`);
      unlink(avatarPath, (err) => {
        if (err) console.error("Error deleting avatar:", err);
      });
    }

    res.status(200).send({
      data: user,
      message: "User was removed successfully!",
    });
  } catch (err) {
    res.status(500).send({
      errors: { common: { msg: "Could not delete the user!" } },
    });
  }
};

// get logged-in user's profile details
const myProfileDetails = async (req, res, next) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email }).select("-password -_id");
    if (!user) {
      return next(createError(404, "User not found"));
    }
    res.send(user);
  } catch (error) {
    next(createError(500, "Server error"));
  }
};

// update user photoURL
const updateImage = async (req, res, next) => {
  try {
    const email = req.params.email;
    const updateData = req.body;
    await User.findOneAndUpdate({ email }, updateData, { upsert: true });
    res.send({ update: true });
  } catch (error) {
    next(createError(500, "Server error"));
  }
};

// update user phone number
const updateNumber = async (req, res, next) => {
  try {
    const email = req.params.email;
    const { phoneNumber } = req.body;
    await User.findOneAndUpdate({ email }, { phoneNumber }, { upsert: true });
    res.send({ update: true });
  } catch (error) {
    next(createError(500, error.message));
  }
};

// update user displayName
const updateUserName = async (req, res, next) => {
  try {
    const email = req.params.email;
    const updateData = req.body;
    await User.findOneAndUpdate({ email }, updateData, { upsert: true });
    res.send({ update: true });
  } catch (error) {
    next(createError(500, "Server error"));
  }
};

// update present address
const updatePresentAddress = async (req, res, next) => {
  try {
    const email = req.params.email;
    const { info } = req.body;
    await User.findOneAndUpdate({ email }, { presentAddress: info }, { upsert: true });
    res.send({ result: true });
  } catch (error) {
    next(createError(500, "Server error"));
  }
};

// update permanent address
const updatePermanentAddress = async (req, res, next) => {
  try {
    const email = req.params.email;
    const { info } = req.body;
    await User.findOneAndUpdate({ email }, { permanentAddress: info }, { upsert: true });
    res.send({ result: true });
  } catch (error) {
    next(createError(500, "Server error"));
  }
};


const updateUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updateData = req.body;

    const updatedUser = await userService.updateUserService(userId, updateData);

    const { password, confirmationToken, passwordResetToken, ...safeUser } = updatedUser.toObject();

    res.json({
      message: "User updated successfully",
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  addUser,
  removeUser,
  getAllAdmins,
  makeRole,
  myProfileDetails,
  updateImage,
  updateNumber,
  updateUserName,
  updatePresentAddress,
  updatePermanentAddress,
  getUserByEmail,
  getLoginUser,
  updateUser,
  getDeliveryAgents,
};
