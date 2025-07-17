const jwt = require("jsonwebtoken");
const createError = require("http-errors");

const getTokenFromRequest = (req) => {
  // Priority 1: Signed Cookies
  if (req?.signedCookies && Object.keys(req.signedCookies).length > 0) {
    return req.signedCookies[process.env.COOKIE_NAME];
  }

  // Priority 2: Bearer Token in Authorization Header
  if (req?.headers?.authorization) {
    return req.headers.authorization.split(" ")[1]; // Bearer <token>
  }

  return null;
};

// Middleware: Verify JWT
const verifyJWT = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    res.clearCookie(process.env.COOKIE_NAME);
    return res.status(401).json({
      success: false,
      message: "Unauthorized Access",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie(process.env.COOKIE_NAME);
    next(createError(403, "Forbidden Access!"));
  }
};

// Middleware: Redirect if logged in (for login/register routes)
const existCookie = (req, res, next) => {
  const hasCookie = req?.signedCookies && Object.keys(req.signedCookies).length > 0;
  if (!hasCookie) {
    return next();
  }
  return res.redirect("/login"); // or homepage, depending on your logic
};

const getUserFromToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error("Unauthorized: No token provided");

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  return decoded;
};

// Middleware: Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized!",
      });
    }
    next();
  };
};

module.exports = { verifyJWT, existCookie, requireRole, getUserFromToken };
