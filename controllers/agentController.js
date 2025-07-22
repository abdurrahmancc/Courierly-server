const Agent = require("../models/Agent");
const agentService = require("../services/agentService");

const getAgentProfile =  async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const agent = await agentService.getAgentProfileService(userId);
    res.json({ agent });
  } catch (err) {
    next(err);
  }
}

const getAgent =  async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const agent = await agentService.getAgentService(userId);
    res.json({ agent });
  } catch (err) {
    next(err);
  }
}

const getAgents =  async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const agents = await agentService.getAgentsService(userId);
    res.json({ agents });
  } catch (err) {
    next(err);
  }
}

const updateAgentProfile = async(req, res, next) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;
    const updatedAgent = await agentService.updateAgentProfileService(userId, updateData);
    res.json({ message: "Agent profile updated successfully", agent: updatedAgent });
  } catch (err) {
    next(err);
  }
}

const updateAgentLocation = async (req, res, next) => {
  try {
    const updatedAgent = await agentService.updateAgentLocationService(req);

    return res.status(200).json({
      message: "Agent location updated successfully",
      data: updatedAgent,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};


module.exports = {
  getAgentProfile,
  updateAgentProfile,
  getAgents,
  getAgent,
  updateAgentLocation
};
