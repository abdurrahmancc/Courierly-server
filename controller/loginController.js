// external imports
const bcrypt = require("bcrypt");
const createError = require("http-errors");
const jwt = require("jsonwebtoken");
const parser = require("ua-parser-js");

// internal imports
const User = require("../models/User");

// login controller
const loginController = async (req, res, next) => {
  try {
    const loginDevices = parser(req.headers["user-agent"]);
    const user = await User.findOne({
      $or: [{ email: req.body.username }, { phoneNumber: req.body.username }],
    });

    if (user && user._id) {
      const isValidPassword = await bcrypt.compare(req.body.password, user.password);

      if (!isValidPassword) {
        throw createError(401, "Login failed! Please try again!");
      }

      // prepare user object for JWT
      const userObject = {
        userId: user._id,
        username: user.displayName,
        phoneNumber: user.phoneNumber || null,
        email: user.email,
        role: user.role || "customer",
      };

      // generate JWT token
      const token = jwt.sign(userObject, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY,
      });

      // Update IP addresses
      if (!user.IPAddress.includes(req.ip)) {
        user.IPAddress.push(req.ip);
      }

      // Update devices
      if (!user.loginDevices.some((d) => d.ua === loginDevices.ua)) {
        user.loginDevices.push(loginDevices);
      }

      // Save updates (only if IP or devices were new)
      await user.save();

      // Set cookie
      res.cookie(process.env.COOKIE_NAME, token, {
        maxAge: parseInt(process.env.JWT_EXPIRY, 10),
        httpOnly: true,
        signed: true,
      });

      // Respond success
      res.status(200).send({ token, message: "success" });
      res.locals.loggedInUser = userObject;
    } else {
      throw createError(401, "Incorrect Username or Password");
    }
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
    const loginDevices = parser(req.headers["user-agent"]);
    const user = await User.findOne({ email: req.body.username });

    if (user && user._id) {
      // existing user: generate token and update IP/devices
      const userObject = {
        userId: user._id,
        username: user.displayName,
        phoneNumber: user.phoneNumber || null,
        email: user.email,
        role: user.role || "user",
      };

      const token = jwt.sign(userObject, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY,
      });

      if (!user.IPAddress.includes(req.ip)) user.IPAddress.push(req.ip);
      if (!user.loginDevices.some((d) => d.ua === loginDevices.ua)) user.loginDevices.push(loginDevices);
      await user.save();

      res.cookie(process.env.COOKIE_NAME, token, {
        maxAge: parseInt(process.env.JWT_EXPIRY, 10),
        httpOnly: true,
        signed: true,
      });

      res.status(200).send({ token, message: "success" });
      res.locals.loggedInUser = userObject;
    } else {
      // new user: create and generate token
      const userObject = {
        providerId: req.body.providerId,
        email: req.body.username,
        username: req.body.displayName,
        role: "user",
      };

      const token = jwt.sign(userObject, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY,
      });

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

      res.cookie(process.env.COOKIE_NAME, token, {
        maxAge: parseInt(process.env.JWT_EXPIRY, 10),
        httpOnly: true,
        signed: true,
      });

      res.status(200).send({
        token,
        message: "User was added successfully!",
      });
    }
  } catch (error) {
    res.status(500).send({
      errors: {
        common: { msg: "There was a server side error!" },
      },
    });
  }
};

// logout (clear cookie)
const logout = (req, res) => {
  res.clearCookie(process.env.COOKIE_NAME);
  res.status(200).send({ message: "logged out" });
};

// dummy token validation endpoint
const isValidToken = (req, res) => {
  res.send({ admin: true });
};

// get token by email (not secure, but included as per your code)
const getToken = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email });
    if (user && user._id) {
      // You can get cookie from req.signedCookies, but here unclear usage in your original
      // Let's just create a new token here as fallback:
      const userObject = {
        userId: user._id,
        username: user.displayName,
        email: user.email,
        role: user.role || "user",
      };
      const token = jwt.sign(userObject, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY,
      });

      res.status(200).send({ token });
    } else {
      throw createError(401, "Incorrect Username or Password");
    }
  } catch (error) {
    res.status(500).send({
      data: { username: req.params.email },
      errors: { common: { msg: error.message } },
    });
  }
};

// check if user is admin or moderator
const isAdmin = (req, res) => {
  if (req.user && req.user.role) {
    const isAdmin = req.user.role === "admin" || req.user.role === "moderator";
    res.send({ admin: isAdmin });
  } else {
    res.send({ admin: false });
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
