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

const updateAgentLocationService = async (req) => {
  const { agentId, lat, lng } = req.body;

  if (!agentId || lat === undefined || lng === undefined) {
    const error = new Error("agentId, lat and lng are required");
    error.status = 400;
    throw error;
  }

  const updatedAgent = await Agent.findByIdAndUpdate(
    agentId,
    {
      "currentLocation.lat": lat,
      "currentLocation.lng": lng,
      "currentLocation.updatedAt": new Date(),
    },
    { new: true }
  );

  if (!updatedAgent) {
    const error = new Error("Agent not found");
    error.status = 404;
    throw error;
  }

  const io = req.app.get("socketio");
  io.emit("agentLocationUpdate", {
    agentId,
    lat,
    lng,
    updatedAt: new Date(),
  });

  return updatedAgent;
};



module.exports = {
  getAgentProfileService,
  updateAgentProfileService,
  getAgentsService,
  getAgentService,
  updateAgentLocationService
};
