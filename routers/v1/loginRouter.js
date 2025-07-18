const express = require("express");
const router = express.Router();
const {
  loginController,
  logout,
  getToken,
  isValidToken,
  isAdmin,
  googleUser,
} = require("../../controller/loginController");
const { verifyJWT, requireRole } = require("../../middleWares/common/checkLogin");

const {
  doLoginValidators,
  doLoginValidationHandler,
} = require("../../middleWares/login/loginValidators");

// verify Token
router.get("/isValidToken", verifyJWT, isValidToken);

// login route
router.post("/", doLoginValidators, doLoginValidationHandler, loginController);

// google user route
router.put("/google", googleUser);

// logout route - clear cookie
router.delete("/", logout);

// check admin role
router.get("/admin/:email", verifyJWT, isAdmin);

// get token by email
router.get("/:email", getToken);

module.exports = router;
