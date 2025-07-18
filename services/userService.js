const User = require("../models/User");


const updateUserService = async(userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  Object.assign(user, updateData);
  await user.save();
  return user;
}

const getDeliveryAgentsService = async () => {
  const agents = await User.find({ role: "deliveryAgent" });
  return agents;
};

module.exports = {
  updateUserService,
  getDeliveryAgentsService,
};