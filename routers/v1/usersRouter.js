const express = require("express");
const {
  addUser,
  getUsers,
  removeUser,
  makeRole,
  getAllAdmins,
  myProfileDetails,
  updateNumber,
  updateImage,
  updateUserName,
  updatePresentAddress,
  updatePermanentAddress,
  getUserByEmail,
  getLoginUser,
} = require("../../controller/usersController");
const { verifyJWT, requireRole } = require("../../middleWares/common/checkLogin");
const { addUserValidationHandler } = require("../../middleWares/users/userValidators");

const router = express.Router();

/* 🔒 Auth-Protected Profile Routes */
router.get("/my-profile-details/:email", verifyJWT, myProfileDetails);
router.put("/update/photoURL/:email", verifyJWT, updateImage);
router.patch("/update/number/:email", verifyJWT, updateNumber);
router.patch("/update/userName/:email", verifyJWT, updateUserName);
router.patch("/update/presentAddress/:email", verifyJWT, updatePresentAddress);
router.patch("/update/permanentAddress/:email", verifyJWT, updatePermanentAddress);

/* 👑 Admin Routes */
router.get("/admin/:email", verifyJWT, requireRole(["admin"]), getAllAdmins);
router.post("/makeRole/:id", verifyJWT, requireRole(["admin"]), makeRole);
router.delete("/:id", verifyJWT, requireRole(["admin"]), removeUser);

/* 📋 General Users Routes */
router.get("/", verifyJWT, requireRole(["admin"]), getUsers);
router.get("/getUserByEmail/:email", verifyJWT, getUserByEmail);
router.get("/getLoginUser", verifyJWT, getLoginUser);
router.post("/", addUserValidationHandler, addUser);

module.exports = router;
