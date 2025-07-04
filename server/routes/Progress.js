const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { authMiddleware } = require("../middleware/auth");
const User = require("../models/User");
const Course = require("../models/Course");
const { createCanvas, loadImage } = require("canvas");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const { v4: uuidv4 } = require("uuid");
const generateCertificateForUser = require("../utils/generateCertificateForUser.js");
const { isAdmin } = require("../middleware/auth");

// Helper: Generate certificate image with user's name
async function generateCertificateImage(templateUrl, name, textSettings) {
  const image = await loadImage(templateUrl);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height);

  // Set font
  const fontSize = textSettings.font.size || 32;
  const fontFamily = textSettings.font.family || "Arial";
  const fontColor = textSettings.font.color || "#000000";
  ctx.font = `bold ${fontSize}px "${fontFamily}"`;
  ctx.fillStyle = fontColor;
  ctx.textAlign = "center";

  // Draw name
  ctx.fillText(
    name,
    textSettings.namePosition.x,
    textSettings.namePosition.y + fontSize
  );

  return canvas.toBuffer("image/png");
}

// Helper: Try to generate certificate after progress update
async function tryGenerateCertificate(user, course, enrollment) {
  if (
    enrollment.progress === 100 &&
    (!enrollment.certificate || !enrollment.certificate.issued) &&
    course.certificate &&
    course.certificate.templateUrl &&
    course.certificate.textSettings
  ) {
    try {
      const certId = uuidv4().slice(0, 8).toUpperCase();
      const buffer = await generateCertificateImage(
        course.certificate.templateUrl,
        user.name,
        course.certificate.textSettings
      );
      const uploadResult = await uploadToCloudinary(
        buffer,
        `certificates/${user._id}`,
        `certificate-${certId}.png`,
        "image/png"
      );
      enrollment.certificate = {
        issued: true,
        issuedAt: new Date(),
        certificateId: certId,
        certificateUrl: uploadResult.secure_url,
        storageUrl: uploadResult.public_id,
      };
      await user.save();
    } catch (err) {
      console.error("Certificate generation error:", err);
    }
  }
}

// Route to issue certificate for a course after completion
router.post(
  "/:courseId/issue-certificate",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      const course = await Course.findById(req.params.courseId);

      if (!user || !course) {
        return res.status(404).json({ message: "User or course not found" });
      }

      const enrollment = user.enrolledCourses.find(
        (e) => e.course.toString() === course._id.toString()
      );
      if (!enrollment) {
        return res.status(404).json({ message: "Not enrolled in this course" });
      }

      if (enrollment.progress !== 100) {
        return res.status(400).json({ message: "Course not completed" });
      }
      if (enrollment.certificate?.issued) {
        return res.status(400).json({ message: "Certificate already issued" });
      }

      try {
        const certObj = await generateCertificateForUser({ user, course });
        enrollment.certificate = certObj;
      } catch (err) {
        console.error("Certificate generation error:", err);
        return res.status(500).json({ message: "Failed to issue certificate" });
      }

      user.markModified("enrolledCourses");
      await user.save();

      res.json({
        message: "Certificate issued",
        certificate: enrollment.certificate,
      });
    } catch (err) {
      console.error("Certificate generation error:", err);
      res.status(500).json({ message: "Failed to issue certificate" });
    }
  }
);

// Route to assign a random new assignment set for a course unit
router.post(
  "/:courseId/unit/:unitIndex/assign-set",
  authMiddleware,
  async (req, res) => {
    try {
      const { courseId, unitIndex } = req.params;
      const { setNumber, excludeSet } = req.body;

      const user = await User.findById(req.user._id);
      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const enrollment = user.enrolledCourses.find(
        (e) => e.course.toString() === courseId
      );

      if (!enrollment) {
        return res.status(404).json({ message: "Not enrolled in this course" });
      }

      const unit = course.units[unitIndex];
      if (!unit?.assignment?.assignmentSets?.length) {
        return res.status(404).json({ message: "No assignment sets found" });
      }

      // Initialize unit progress if needed
      if (!enrollment.unitsProgress[unitIndex]) {
        enrollment.unitsProgress[unitIndex] = {
          unitIndex: parseInt(unitIndex),
          completed: false,
          lessonsCompleted: [],
          assignment: {},
          lastAccessed: new Date(),
        };
      }

      const currentAssignment = enrollment.unitsProgress[unitIndex].assignment;
      let assignedSetNumber = currentAssignment?.assignedSetNumber;
      let assignedSet = assignedSetNumber
        ? unit.assignment.assignmentSets.find(
            (set) => set.setNumber === assignedSetNumber
          )
        : null;

      // If assignment is already submitted, check if perfect score
      if (currentAssignment && currentAssignment.status === "submitted") {
        // If assignedSetNumber is null, try to get the last attempted set from submission length
        if (!assignedSet && unit.assignment.assignmentSets.length === 1) {
          assignedSet = unit.assignment.assignmentSets[0];
        }
        const totalPossibleScore = assignedSet
          ? assignedSet.questions.reduce((acc, q) => acc + q.marks, 0)
          : 0;
        if (
          currentAssignment.score === totalPossibleScore &&
          totalPossibleScore > 0
        ) {
          return res.status(400).json({
            message: "Assignment already completed with perfect score",
          });
        }
      }

      // Get available sets excluding the current one if excludeSet is provided
      let availableSets = unit.assignment.assignmentSets;
      if (excludeSet) {
        availableSets = availableSets.filter(
          (set) => set.setNumber !== excludeSet
        );
      }

      if (availableSets.length === 0) {
        return res.status(400).json({ message: "No more sets available" });
      }

      // Pick setNumber if provided, else random
      let newAssignedSet;
      if (setNumber) {
        newAssignedSet = availableSets.find(
          (set) => set.setNumber === setNumber
        );
      }
      if (!newAssignedSet) {
        newAssignedSet =
          availableSets[Math.floor(Math.random() * availableSets.length)];
      }
      const newAssignedSetNumber = newAssignedSet.setNumber;

      // Update assignment progress (always re-initialize)
      enrollment.unitsProgress[unitIndex].assignment = {
        assignedSetNumber: newAssignedSetNumber,
        status: "not_started",
        submission: [],
        score: 0,
        attemptCount: (currentAssignment?.attemptCount || 0) + 1,
        questionsProgress: newAssignedSet.questions.map((_, idx) => ({
          questionIndex: idx,
          answered: false,
          selectedOption: null,
          correct: false,
        })),
        lastAccessed: new Date(),
      };

      await user.save();
      res.json(enrollment);
    } catch (err) {
      console.error("Error assigning set:", err);
      res.status(500).json({ message: "Error assigning assignment set" });
    }
  }
);

// Get course progress (this should be AFTER more specific routes)
router.get("/:courseId", authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const user = await User.findById(req.user._id);
    const enrollment = user.enrolledCourses.find(
      (e) => e.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({ message: "Not enrolled in this course" });
    }

    // Initialize unit progress if not exists
    if (!enrollment.unitsProgress || !enrollment.unitsProgress.length) {
      const course = await Course.findById(courseId);
      enrollment.unitsProgress = course.units.map((unit, unitIndex) => ({
        unitIndex,
        completed: false,
        lessonsCompleted: unit.lessons.map((_, lessonIndex) => ({
          lessonIndex,
          completed: false,
          resourcesProgress: [],
          lastAccessed: new Date(),
        })),
        assignment: {
          assignedSetNumber: null,
          status: "not_started",
          submission: [],
          score: 0,
          questionsProgress: [],
        },
      }));
      await user.save();
    }

    res.json(enrollment);
  } catch (err) {
    console.error("Error fetching progress:", err);
    res.status(500).json({ message: "Error fetching progress" });
  }
});

// Route to update lesson progress
router.post(
  "/:courseId/unit/:unitIndex/lesson/:lessonIndex",
  authMiddleware,
  async (req, res) => {
    try {
      const { courseId, unitIndex, lessonIndex } = req.params;
      const user = await User.findById(req.user._id);
      const course = await Course.findById(courseId);

      if (!user || !course) {
        return res.status(404).json({ message: "User or course not found" });
      }

      const enrollment = user.enrolledCourses.find(
        (e) => e.course.toString() === courseId
      );
      if (!enrollment) {
        return res.status(404).json({ message: "Not enrolled in this course" });
      }

      // Ensure unitsProgress and lessonsCompleted arrays are correct length
      const courseUnit = course.units[unitIndex];
      if (!enrollment.unitsProgress[unitIndex]) {
        enrollment.unitsProgress[unitIndex] = {
          unitIndex: parseInt(unitIndex),
          completed: false,
          lessonsCompleted: [],
          assignment: null,
          lastAccessed: new Date(),
        };
      }
      const unit = enrollment.unitsProgress[unitIndex];
      if (!unit.lessonsCompleted) unit.lessonsCompleted = [];
      for (
        let i = unit.lessonsCompleted.length;
        i < courseUnit.lessons.length;
        i++
      ) {
        unit.lessonsCompleted[i] = {
          lessonIndex: i,
          completed: false,
          resourcesProgress: [],
          lastAccessed: new Date(),
        };
      }

      // Mark lesson as completed
      unit.lessonsCompleted[lessonIndex].completed = true;
      unit.lessonsCompleted[lessonIndex].lastAccessed = new Date();

      // Check if all lessons in the unit are completed
      const allLessonsCompleted =
        unit.lessonsCompleted.length === courseUnit.lessons.length &&
        unit.lessonsCompleted.every((l) => l.completed);

      // If all lessons are completed and there's no assignment or assignment is completed
      if (
        allLessonsCompleted &&
        (!unit.assignment || unit.assignment.status === "submitted")
      ) {
        unit.completed = true;
      }

      // Update overall course progress
      enrollment.progress = Math.round(
        (enrollment.unitsProgress.filter((u) => u.completed).length /
          enrollment.unitsProgress.length) *
          100
      );

      // If course is completed, update status and generate certificate
      if (enrollment.progress === 100) {
        enrollment.status = "completed";
        if (!enrollment.certificate || !enrollment.certificate.issued) {
          try {
            const certObj = await generateCertificateForUser({ user, course });
            enrollment.certificate = certObj;
          } catch (err) {
            console.error("Certificate generation error:", err);
          }
        }
      }

      user.markModified("enrolledCourses");
      await user.save();

      // Return the full updated enrollment object for frontend state
      res.json(enrollment);
    } catch (err) {
      console.error("Progress update error:", err);
      res.status(500).json({ message: "Failed to update progress" });
    }
  }
);

router.post("/:courseId/unit/:unitIndex/violation", authMiddleware, async (req, res) => {
  const { courseId, unitIndex } = req.params;
  const user = await User.findById(req.user._id);
  const enrollment = user.enrolledCourses.find(e => e.course.toString() === courseId);
  const unitProgress = enrollment.unitsProgress[unitIndex];
  if (!unitProgress.assignment) return res.status(400).json({ message: "No assignment" });

  unitProgress.assignment.violationCount = (unitProgress.assignment.violationCount || 0) + 1;
  if (unitProgress.assignment.violationCount >= 3) {
    unitProgress.assignment.blocked = true;
  }
  user.markModified("enrolledCourses");
  await user.save();
  res.json({
    violationCount: unitProgress.assignment.violationCount,
    blocked: unitProgress.assignment.blocked,
  });
});


router.post("/:courseId/unit/:unitIndex/reset-block/:userId", authMiddleware, isAdmin, async (req, res) => {
  const { courseId, unitIndex, userId } = req.params;
  const user = await User.findById(userId);
  const enrollment = user.enrolledCourses.find(e => e.course.toString() === courseId);
  const unitProgress = enrollment.unitsProgress[unitIndex];
  if (!unitProgress.assignment) return res.status(400).json({ message: "No assignment" });

  unitProgress.assignment.violationCount = 0;
  unitProgress.assignment.blocked = false;
  user.markModified("enrolledCourses");
  await user.save();
  res.json({ message: "Block reset" });
});

router.get("/:courseId/unit/:unitIndex/block-status", authMiddleware, async (req, res) => {
  const { courseId, unitIndex } = req.params;
  const user = await User.findById(req.user._id);
  const enrollment = user.enrolledCourses.find(e => e.course.toString() === courseId);
  const unitProgress = enrollment.unitsProgress[unitIndex];
  if (!unitProgress.assignment) return res.json({ violationCount: 0, blocked: false });
  res.json({
    violationCount: unitProgress.assignment.violationCount || 0,
    blocked: unitProgress.assignment.blocked || false,
  });
});

module.exports = router;
