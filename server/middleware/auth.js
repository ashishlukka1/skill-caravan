const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("enrolledCourses.course", "title");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token.",
      });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired.",
      });
    }
    res.status(500).json({
      message: "Authentication failed.",
      error: err.message,
    });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin only.",
    });
  }
  next();
};

// Middleware to check if user is instructor
const isInstructor = (req, res, next) => {
  if (req.user.role !== "instructor" && req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Instructor only.",
    });
  }
  next();
};

const isInstructorOrAdmin = (req, res, next) => {
  if (req.user.role === "admin" || req.user.role === "instructor") {
    return next();
  }
  res.status(403).json({ message: "Access denied. Instructor/Admin only." });
};

module.exports = {
  authMiddleware,
  isAdmin,
  isInstructor,
  isInstructorOrAdmin,
};