const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authMiddleware, isAdmin } = require("../middleware/auth");
const Course = require("../models/Course");

async function reassignRecurringCourses(userId) {
  console.log("Running reassignRecurringCourses for", userId);
  const user = await User.findById(userId);

  // Get all course IDs from enrollments
  const courseIds = user.enrolledCourses.map(e => e.course);
  // Fetch all courses in one go
  const courses = await Course.find({ _id: { $in: courseIds } });
  const courseMap = new Map(courses.map(c => [c._id.toString(), c]));

  let changed = false;
  for (const enrollment of user.enrolledCourses) {
    const course = courseMap.get(enrollment.course.toString());
    if (
      course &&
      course.isRecurring &&
      course.recurringNextDate &&
      enrollment.nextDueDate &&
      new Date() >= new Date(enrollment.nextDueDate)
    ) {
      if (
        enrollment.status === "completed" &&
        enrollment.completedAt &&
        new Date(enrollment.completedAt) < new Date(enrollment.nextDueDate)
      ) {
        enrollment.status = "active";
        enrollment.progress = 0;
        enrollment.unitsProgress = (course.units || []).map(
          (unit, unitIndex) => ({
            unitIndex,
            completed: false,
            lessonsCompleted: (unit.lessons || []).map((_, lessonIndex) => ({
              lessonIndex,
              completed: false,
              resourcesProgress: [],
              lastAccessed: new Date(),
            })),
            assignment:
              unit.assignment?.assignmentSets?.length > 0
                ? {
                    assignedSetNumber: null,
                    status: "not_started",
                    submission: [],
                    score: 0,
                    attemptCount: 0,
                    questionsProgress: [],
                    lastAccessed: new Date(),
                  }
                : null,
            lastAccessed: new Date(),
          })
        );
        enrollment.nextDueDate = course.recurringNextDate;
        changed = true;
           }
    }
  }
  if (changed) {
    user.markModified("enrolledCourses");
    await user.save();
  }
}

// [Get] logged-in user's profile
router.get("/profile", authMiddleware, (req, res) => {
  res.json(req.user);
});

// [GET] search users by name or employeeId
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

// [PATCH] Update profile    
router.patch("/profile", authMiddleware, async (req, res) => {
  try {
    console.log("Update request received:", req.body);

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

    console.log("Fields to update:", updates);

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
    await reassignRecurringCourses(req.user._id); 
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

router.post("/reassign-recurring", authMiddleware, async (req, res) => {
  try {
    await reassignRecurringCourses(req.user._id);
    res.json({ message: "Recurring courses reassigned" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reassign recurring courses" });
  }
});

module.exports = router;
module.exports.reassignRecurringCourses = reassignRecurringCourses;
