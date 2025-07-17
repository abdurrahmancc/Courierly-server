const { check, validationResult } = require("express-validator");
const createError = require("http-errors");
const path = require("path");
const { unlink } = require("fs");

// internal imports
const User = require("../../models/User");

const addUserValidationHandler = function (req, res, next) {
  const errors = validationResult(req);
  const mappedErrors = errors.mapped();

  if (Object.keys(mappedErrors)?.length === 0) {
    return next();
  }

  // Remove uploaded files if validation fails
  if (req.files?.length > 0) {
    req.files.forEach((file) => {
      unlink(
        path.join(__dirname, "..", "public", "uploads", "avatars", file.filename),
        (err) => {
          if (err) console.error("File delete error:", err.message);
        }
      );
    });
  }

  // Send validation errors
  res.status(400).send({
    errors: mappedErrors,
  });
};

module.exports = {
  addUserValidationHandler,
};
