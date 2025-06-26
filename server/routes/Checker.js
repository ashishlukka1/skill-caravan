const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const {
  authMiddleware,
  isInstructor,
  isInstructorOrAdmin,
  isAdmin,
  isChecker
} = require("../middleware/auth");
const Course = require("../models/Course");
const User = require("../models/User");



router.get("/pending-approval", authMiddleware, isChecker, async (req, res) => {
  try {
    const courses = await Course.find({ approvalStatus: "pending" })
      .populate("instructor", "name email")
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    console.error("Error in /pending-approval:", err);
    res.status(500).json({ message: "Error fetching pending courses" });
  }
});


// Approve a course
router.post("/:id/approve", authMiddleware, isChecker, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    course.approvalStatus = "approved";
    course.published = true;
    course.checker = req.user._id;
    course.checkerFeedback = req.body.feedback || "";
    await course.save();
    res.json({ message: "Course approved and published", course });
  } catch (err) {
    res.status(500).json({ message: "Error approving course" });
  }
});

// Reject a course
router.post("/:id/reject", authMiddleware, isChecker, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    course.approvalStatus = "rejected";
    course.published = false;
    course.checker = req.user._id;
    course.checkerFeedback = req.body.feedback || "";
    await course.save();
    res.json({ message: "Course rejected", course });
  } catch (err) {
    res.status(500).json({ message: "Error rejecting course" });
  }
});

router.get("/checked-by-me", authMiddleware, isChecker, async (req, res) => {
  try {
    const courses = await Course.find({ checker: req.user._id });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Error fetching checked courses" });
  }
});

module.exports = router;