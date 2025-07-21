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
    const { agentId, lat, lng } = req.body;

    if (!agentId || lat === undefined || lng === undefined) {
      return res.status(400).json({ message: "agentId, lat and lng are required" });
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
      return res.status(404).json({ message: "Agent not found" });
    }


    const io = req.app.get("socketio");
    io.emit("agentLocationUpdate", {
      agentId,
      lat,
      lng,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      message: "Agent location updated successfully",
      data: updatedAgent,
    });
  } catch (err) {
    next(err);
  }
};


module.exports = {
  getAgentProfile,
  updateAgentProfile,
  getAgents,
  getAgent,
  updateAgentLocation
};
