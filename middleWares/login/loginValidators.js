const { check, validationResult } = require("express-validator");

// Validation rules
const doLoginValidators = [
  check("username")
    .trim()
    .notEmpty()
    .withMessage("Mobile number or email is required!"),
  check("password")
    .isLength({ min: 5 })
    .withMessage("Password must be at least 5 characters long"),
];

// Validation error handler middleware
const doLoginValidationHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      data: { username: req.body.username || null },
      errors: errors.mapped(),
    });
  }
  next();
};

module.exports = { doLoginValidators, doLoginValidationHandler };
