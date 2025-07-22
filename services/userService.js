const User = require("../models/User");
const Agent = require("../models/Agent");
const mongoose = require("mongoose");


const getAllUsersService = async () => await User.find();

const getUserByEmailService = async (email) => await User.findOne({ email });

const getLoginUserService = async (email) => await User.findOne({ email });

const getAllAdminsService = async () => await User.find({ role: "admin" });

const addUserService = async (userData) => {
  const newUser = new User(userData);
  await newUser.save();
  return newUser;
};

const makeRoleService = async (id, role) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const options = { new: true, useFindAndModify: false, session };
    const updatedUser = await User.findByIdAndUpdate(id, { role }, options);

    if (!updatedUser) {
      await session.abortTransaction();
      return { success: false };
    }

    if (role === "deliveryAgent") {
      const newAgent = new Agent({ user: id });
      await newAgent.save({ session });
    }

    await session.commitTransaction();
    return { success: true, updatedUser };
  } catch {
    await session.abortTransaction();
    return { success: false };
  } finally {
    session.endSession();
  }
};

const removeUserService = async (id) => await User.findByIdAndDelete(id);

const updateImageService = async (email, updateData) =>
  await User.findOneAndUpdate({ email }, updateData, { upsert: true });

const updateNumberService = async (email, phoneNumber) =>
  await User.findOneAndUpdate({ email }, { phoneNumber }, { upsert: true });

const updateUserNameService = async (email, updateData) =>
  await User.findOneAndUpdate({ email }, updateData, { upsert: true });

const updatePresentAddressService = async (email, info) =>
  await User.findOneAndUpdate(
    { email },
    { presentAddress: info },
    { upsert: true }
  );

const updatePermanentAddressService = async (email, info) =>
  await User.findOneAndUpdate(
    { email },
    { permanentAddress: info },
    { upsert: true }
  );

const updateUserService = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  Object.assign(user, updateData);
  await user.save();
  return user;
};

const getDeliveryAgentsService = async () => {
  const agents = await User.find({ role: "deliveryAgent" });
  return agents;
};

module.exports = {
  getAllUsersService,
  getUserByEmailService,
  getLoginUserService,
  getAllAdminsService,
  addUserService,
  makeRoleService,
  removeUserService,
  updateImageService,
  updateNumberService,
  updateUserNameService,
  updatePresentAddressService,
  updatePermanentAddressService,
  updateUserService,
  getDeliveryAgentsService,
};
