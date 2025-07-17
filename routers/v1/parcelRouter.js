const express = require("express");
const router = express.Router();
const {
  createParcel,
  getAllParcels,
  getMyParcels,
  getAssignedParcels,
  getParcelById,
  updateParcelStatus,
  assignAgent,
  deleteParcel,
  trackParcel,
  updateParcelLocation,
  cancelParcel,
} = require("../../controller/parcelController");
const { requireRole, verifyJWT } = require("../../middleWares/common/checkLogin");



/*  Customer Routes */
router.post("/", verifyJWT, requireRole(["customer"]), createParcel);
router.get("/my", verifyJWT, requireRole(["customer"]), getMyParcels);
router.get("/:id/tracking", verifyJWT, requireRole(["customer"]), trackParcel);
router.patch("/cancel/:id", verifyJWT, requireRole(["customer"]), cancelParcel);

/*  Delivery Agent Routes */
router.get("/assigned", verifyJWT, requireRole(["deliveryAgent"]), getAssignedParcels);
router.patch("/:id/status", verifyJWT, requireRole(["deliveryAgent"]), updateParcelStatus);
router.patch("/:id/location", verifyJWT, requireRole(["deliveryAgent"]), updateParcelLocation);

/*  Admin Routes */
router.get("/", verifyJWT, requireRole(["admin"]), getAllParcels);
router.patch("/:id/assign", verifyJWT, requireRole(["admin"]), assignAgent);
router.delete("/:id", verifyJWT, requireRole(["admin"]), deleteParcel);

/* Shared Routes */
router.get("/:id", verifyJWT, getParcelById); // all roles can view details if authorized

module.exports = router;
