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

const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsersService();
    res.send({ users });
  } catch (err) {
    next(err);
  }
};

const getUserByEmail = async (req, res, next) => {
  try {
    const user = await userService.getUserByEmailService(req.params.email);
    res.send({ user });
  } catch (err) {
    next(err);
  }
};

const getLoginUser = async (req, res, next) => {
  try {
    const userToken = getUserFromToken(req);
    const user = await userService.getLoginUserService(userToken.email);
    res.send({ user });
  } catch (err) {
    next(err);
  }
};

const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await userService.getAllAdminsService();
    res.send({ users: admins });
  } catch (err) {
    next(createError(401, "Unauthorized Access"));
  }
};

const addUser = async (req, res, next) => {
  try {
    const loginDevices = parser(req.headers["user-agent"]);
    let hashedPassword;

    if (req.body.password) {
      hashedPassword = await bcrypt.hash(req.body.password, 10);
    }

    const userData = {
      ...req.body,
      password: hashedPassword,
      IPAddress: req.ip,
      loginDevices,
      avatar: req.files?.length ? req.files[0].filename : undefined,
    };

    const newUser = await userService.addUserService(userData);

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
    res.status(500).send({
      errors: { common: { msg: err.message || "Server Error" } },
    });
  }
};

const makeRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const result = await userService.makeRoleService(id, role);
    if (!result.success) {
      return next(createError(404, "User not found or update failed"));
    }

    res.send({ result: result.updatedUser, message: "Role updated successfully" });
  } catch (err) {
    next(createError(500, "Server error"));
  }
};

const removeUser = async (req, res, next) => {
  try {
    const user = await userService.removeUserService(req.params.id);
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

const myProfileDetails = async (req, res, next) => {
  try {
    const email = req.params.email;
    const user = await userService.getUserByEmailService(email);
    if (!user) {
      return next(createError(404, "User not found"));
    }
    const { password, _id, ...safeData } = user.toObject();
    res.send(safeData);
  } catch (err) {
    next(createError(500, "Server error"));
  }
};

const updateImage = async (req, res, next) => {
  try {
    await userService.updateImageService(req.params.email, req.body);
    res.send({ update: true });
  } catch (err) {
    next(createError(500, "Server error"));
  }
};

const updateNumber = async (req, res, next) => {
  try {
    await userService.updateNumberService(req.params.email, req.body.phoneNumber);
    res.send({ update: true });
  } catch (err) {
    next(createError(500, err.message));
  }
};

const updateUserName = async (req, res, next) => {
  try {
    await userService.updateUserNameService(req.params.email, req.body);
    res.send({ update: true });
  } catch (err) {
    next(createError(500, "Server error"));
  }
};

const updatePresentAddress = async (req, res, next) => {
  try {
    await userService.updatePresentAddressService(req.params.email, req.body.info);
    res.send({ result: true });
  } catch (err) {
    next(createError(500, "Server error"));
  }
};

const updatePermanentAddress = async (req, res, next) => {
  try {
    await userService.updatePermanentAddressService(req.params.email, req.body.info);
    res.send({ result: true });
  } catch (err) {
    next(createError(500, "Server error"));
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
