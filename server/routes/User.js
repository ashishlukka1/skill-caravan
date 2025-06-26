const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authMiddleware, isAdmin } = require("../middleware/auth");

// Get logged-in user's profile
router.get("/profile", authMiddleware, (req, res) => {
  res.json(req.user);
});

// search users by name or employeeId
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const query = req.query.q;
    const users = await User.find({
      $or: [
        { name: new RegExp(query, "i") },
        { employeeId: new RegExp(query, "i") },
      ],
    })
      .select("name employeeId team")
      .limit(10);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error searching users" });
  }
});

// Update profile
router.patch("/profile", authMiddleware, async (req, res) => {
  try {
    console.log("Update request received:", req.body); // Debug log

    // Only allow these fields to be updated
    const allowedFields = [
      "name",
      "employeeId",
      "mobile",
      "team",
      "designation",
    ];
    const updates = {};

    // Build update object with only allowed fields that have values
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        updates[field] = req.body[field];
      }
    });

    console.log("Fields to update:", updates); // Debug log

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // Update user using findByIdAndUpdate for better reliability
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
        select: "-password", // Exclude password from response
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User updated successfully:", updatedUser); // Debug log
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Error updating profile:", err); // Debug log

    // Handle validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        message: "Validation error",
        errors: errors,
      });
    }

    res.status(500).json({
      message: "Error updating profile",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

// Get all enrolled courses + progress
router.get("/enrollments", authMiddleware, async (req, res) => {
  try {
    await req.user.populate("enrolledCourses.course");
    res.json(req.user.enrolledCourses);
  } catch (err) {
    res.status(500).json({ message: "Error fetching enrollments" });
  }
});

// Admin: Get any user
router.get("/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user" });
  }
});

// Get course-wise detailed progress
router.get("/:id/progress/:courseId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const enrollment = user.enrolledCourses.find(
      (e) => e.course.toString() === req.params.courseId
    );
    if (!enrollment)
      return res.status(404).json({ message: "Not enrolled in this course" });
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ message: "Error fetching progress" });
  }
});

// Update course progress in user's enrollment
router.patch(
  "/enrollments/:courseId/status",
  authMiddleware,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { status } = req.body;

      const user = await User.findById(req.user._id);
      const enrollment = user.enrolledCourses.find(
        (e) => e.course.toString() === courseId
      );

      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      enrollment.status = status;
      if (status === "completed") {
        enrollment.completedAt = new Date();
      }

      await user.save();
      res.json({ message: "Enrollment status updated", enrollment });
    } catch (err) {
      console.error("Error updating enrollment status:", err);
      res.status(500).json({ message: "Error updating enrollment status" });
    }
  }
);

module.exports = router;
