const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const parser = require("ua-parser-js");
const createError = require("http-errors");
const User = require("../models/User");



//  Login Service
const loginService = async (req) => {
  const loginDevices = parser(req.headers["user-agent"]);

  const user = await User.findOne({
    $or: [{ email: req.body.username }, { phoneNumber: req.body.username }],
  });

  if (!user) {
    throw createError(401, "Incorrect Username or Password");
  }

  const isValidPassword = await bcrypt.compare(req.body.password, user.password);

  if (!isValidPassword) {
    throw createError(401, "Login failed! Please try again!");
  }

  const userObject = {
    userId: user._id,
    username: user.displayName,
    phoneNumber: user.phoneNumber || null,
    email: user.email,
    role: user.role || "customer",
  };

  const token = jwt.sign(userObject, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });

  // update IP and devices
  if (!user.IPAddress.includes(req.ip)) user.IPAddress.push(req.ip);
  if (!user.loginDevices.some((d) => d.ua === loginDevices.ua)) user.loginDevices.push(loginDevices);

  await user.save();

  return { token, userObject };
};

//  Google User Login/Register Service
const googleUserService = async (req) => {
  const loginDevices = parser(req.headers["user-agent"]);

  let user = await User.findOne({ email: req.body.username });

  const userObject = {
    email: req.body.username,
    username: req.body.displayName,
    role: "user",
  };

  if (user) {
    userObject.userId = user._id;
    userObject.phoneNumber = user.phoneNumber || null;
    userObject.role = user.role || "user";

    const token = jwt.sign(userObject, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });

    if (!user.IPAddress.includes(req.ip)) user.IPAddress.push(req.ip);
    if (!user.loginDevices.some((d) => d.ua === loginDevices.ua)) user.loginDevices.push(loginDevices);
    await user.save();

    return { token, userObject, isNew: false };
  }

  // create new user
  const newUser = new User({
    IPAddress: [req.ip],
    loginDevices: [loginDevices],
    displayName: req.body.displayName,
    providerId: req.body.providerId,
    email: req.body.username,
    photoURL: req.body.photoURL,
    role: "user",
  });

  await newUser.save();

  userObject.userId = newUser._id;

  const token = jwt.sign(userObject, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });

  return { token, userObject, isNew: true };
};

//  Logout Service
const logoutService = (res) => {
  res.clearCookie(process.env.COOKIE_NAME);
  return { message: "logged out" };
};

//  Get Token By Email Service
const getTokenService = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw createError(401, "Incorrect Username or Password");
  }

  const userObject = {
    userId: user._id,
    username: user.displayName,
    email: user.email,
    role: user.role || "user",
  };

  const token = jwt.sign(userObject, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });

  return token;
};

//  Check Token Validity Service
const isValidTokenService = () => {
  return { admin: true };
};

//  Admin Role Check Service
const isAdminService = (user) => {
  if (user && user.role) {
    return { admin: user.role === "admin" || user.role === "moderator" };
  }
  return { admin: false };
};

module.exports = {
  loginService,
  googleUserService,
  logoutService,
  getTokenService,
  isValidTokenService,
  isAdminService,
};
