const express = require("express");
const { verifyJWT } = require("../../middleWares/common/checkLogin");
const router = express.Router();
const {  getAgentProfile, updateAgentProfile, getAgents, getAgent, updateAgentLocation,} = require("../../controllers/agentController")


router.get("/getAgentProfile", verifyJWT, getAgentProfile);
router.get("/getAgents", verifyJWT, getAgents)
router.get("/getAgent", verifyJWT, getAgent)
router.patch("/updateAgentProfile", verifyJWT, updateAgentProfile);
router.post("/update-location", updateAgentLocation);

module.exports = router;
