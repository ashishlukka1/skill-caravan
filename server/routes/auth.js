const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Course = require("../models/Course");
const { reassignRecurringCourses } = require("../routes/User");



async function autoEnrollDefaultCourses(userId) {
  const defaultCourses = await Course.find({ isDefault: true });
  const user = await User.findById(userId);
  for (const course of defaultCourses) {
    const alreadyEnrolled = user.enrolledCourses.some(
      (e) => e.course.toString() === course._id.toString()
    );
    if (!alreadyEnrolled) {
      user.enrolledCourses.push({
        course: course._id,
        enrolledAt: new Date(),
        status: "active",
        progress: 0,
        unitsProgress: (course.units || []).map((unit, unitIndex) => ({
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
        })),
        assignedByAdmin: true,
      });
      if (!course.studentsEnrolled.includes(user._id)) {
        course.studentsEnrolled.push(user._id);
        await course.save();
      }
    }
  }
  await user.save();
}


// Register
router.post("/register", async (req, res) => {

  try {
    const {
      name,
      email,
      password,
      role,
      employeeId,
      mobile,
      team,
      designation,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role || !employeeId) {
      return res.status(400).json({
        message: "Name, email, password, role, and employee ID are required",
      });
    }

    // Check if user already exists by email
    if (await User.findOne({ email })) {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }

    // Check if employee ID already exists
    if (await User.findOne({ employeeId })) {
      return res.status(409).json({ message: "Employee ID already exists" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Validate role
    const validRoles = ["Employee", "instructor", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Validate team if provided
    const validTeams = [
      "Engineering-dev",
      "Engineering-Support",
      "IT",
      "Administration",
      "Accounts",
      "Management",
      "HR",
    ];
    if (team && !validTeams.includes(team)) {
      return res.status(400).json({ message: "Invalid team specified" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      employeeId,
      mobile,
      team: team || undefined,
      designation,
    });

    await user.save();

await autoEnrollDefaultCourses(user._id);

    res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
    });
  } catch (err) {
    console.error("Registration error:", err);

    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        message: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } already exists`,
      });
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      message: "Server error",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
});



// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    reassignRecurringCourses(user._id).catch(console.error);


    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        team: user.team,
        designation: user.designation,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Server error",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
});

// Logout just deleting token
router.get("/logout", (req, res) => {
  res.json({ message: "Logged out" });
});

module.exports = router;
