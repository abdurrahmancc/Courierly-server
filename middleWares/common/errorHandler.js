const createError = require("http-errors");

// 404 Not Found Handler
const notFoundHandler = (req, res, next) => {
  next(createError(404, "Your requested content was not found!"));
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "There was a server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }), // Optional stack trace in dev mode
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
