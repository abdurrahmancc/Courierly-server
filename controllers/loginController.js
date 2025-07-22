// external imports
const bcrypt = require("bcrypt");
const createError = require("http-errors");
const jwt = require("jsonwebtoken");
const parser = require("ua-parser-js");

// internal imports
const User = require("../models/User");
const { loginService, googleUserService, logoutService, isValidTokenService, getTokenService, isAdminService } = require("../services/loginService");

// login controller
const loginController = async (req, res, next) => {
  try {
    const { token, userObject } = await loginService(req);

    res.cookie(process.env.COOKIE_NAME, token, {
      maxAge: parseInt(process.env.JWT_EXPIRY),
      httpOnly: true,
      signed: true,
    });

    res.locals.loggedInUser = userObject;

    res.status(200).send({ token, message: "success" });
  } catch (error) {
    res.status(401).send({
      data: { username: req.body.username },
      errors: { common: { msg: error.message } },
    });
  }
};

// Google user login or registration
const googleUser = async (req, res, next) => {
   try {
    const { token, userObject, isNew } = await googleUserService(req);

    res.cookie(process.env.COOKIE_NAME, token, {
      maxAge: parseInt(process.env.JWT_EXPIRY),
      httpOnly: true,
      signed: true,
    });

    res.locals.loggedInUser = userObject;

    res.status(200).send({
      token,
      isNew,
      message: "success",
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// logout (clear cookie)
const logout = (req, res) => {
  try {
    logoutService(res);
    res.status(200).send({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// dummy token validation endpoint
const isValidToken = async (req, res) => {
   try {
    const isValid = await isValidTokenService(req.body.token);
    res.status(200).send({ isValid });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// get token by email (not secure, but included as per your code)
const getToken = async (req, res) => {
  try {
    const token = await getTokenService(req.body.email);
    res.status(200).send({ token });
  } catch (error) {
    res.status(401).send({
      data: { username: req.body.email },
      errors: { common: { msg: error.message } },
    });
  }
};

// check if user is admin or moderator
const isAdmin =async (req, res) => {
  try {
    const result = await isAdminService(req.user);
    res.status(200).send(result);
  } catch (error) {
    res.status(403).send({ error: error.message });
  }
};

module.exports = {
  loginController,
  googleUser,
  logout,
  getToken,
  isValidToken,
  isAdmin,
};
