const Agent = require("../models/Agent");
const User = require("../models/User");
const { populate } = require("../models/User");


const getAgentProfileService = async (userId) => {
  const agent = await Agent.findOne({ user: userId }).populate("user");
  if (!agent) throw new Error("Agent profile not found");
  return agent;
}

const getAgentService = async (userId) => {
  const agent = await Agent.findOne({user: userId});
  if (!agent) throw new Error("Agent profile not found");
  return agent;
}

const getAgentsService = async () => {
  const agents = await Agent.find().populate("user");
  if (!agents) throw new Error("Agents profile not found");
  return agents;
}


const updateAgentProfileService = async (userId, updateData) => {
  const agent = await Agent.findOneAndUpdate({ user: userId }, updateData, {
    new: true,
    runValidators: true,
    upsert: true,
  });
  if (!agent) throw new Error("Agent profile not found");
  return agent;
}

module.exports = {
  getAgentProfileService,
  updateAgentProfileService,
  getAgentsService,
  getAgentService
};
