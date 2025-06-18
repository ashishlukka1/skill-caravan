const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { authMiddleware } = require("../middleware/auth");
const User = require("../models/User");
const Course = require("../models/Course");
const { createCanvas, loadImage } = require("canvas");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const { v4: uuidv4 } = require("uuid");

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

router.post("/:courseId/issue-certificate", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const course = await Course.findById(req.params.courseId);

    if (!user || !course) {
      return res.status(404).json({ message: "User or course not found" });
    }

    // Find enrollment
    const enrollment = user.enrolledCourses.find(
      (e) => e.course.toString() === course._id.toString()
    );
    if (!enrollment) {
      return res.status(404).json({ message: "Not enrolled in this course" });
    }

    // Only issue if progress is 100 and not already issued
    if (enrollment.progress !== 100) {
      return res.status(400).json({ message: "Course not completed" });
    }
    if (enrollment.certificate?.issued) {
      return res.status(400).json({ message: "Certificate already issued" });
    }

    // Generate certificate
    const certId = uuidv4().slice(0, 8).toUpperCase();
    const buffer = await generateCertificateImage(
      course.certificate.templateUrl,
      user.name,
      course.certificate.textSettings
    );

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      buffer,
      `certificates/${user._id}`,
      `certificate-${certId}.png`,
      "image/png"
    );

    // Update enrollment certificate info
    enrollment.certificate = {
      issued: true,
      issuedAt: new Date(),
      certificateId: certId,
      certificateUrl: uploadResult.secure_url,
      storageUrl: uploadResult.public_id,
    };

    await user.save();

    res.json({
      message: "Certificate issued",
      certificate: enrollment.certificate,
    });
  } catch (err) {
    console.error("Certificate generation error:", err);
    res.status(500).json({ message: "Failed to issue certificate" });
  }
});

router.post("/:courseId/unit/:unitIndex/assign-set", 
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
        e => e.course.toString() === courseId
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
          lastAccessed: new Date()
        };
      }

      const currentAssignment = enrollment.unitsProgress[unitIndex].assignment;
      let assignedSetNumber = currentAssignment?.assignedSetNumber;
      let assignedSet = assignedSetNumber
        ? unit.assignment.assignmentSets.find(set => set.setNumber === assignedSetNumber)
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
          return res.status(400).json({ message: "Assignment already completed with perfect score" });
        }
      }

      // Get available sets excluding the current one if excludeSet is provided
      let availableSets = unit.assignment.assignmentSets;
      if (excludeSet) {
        availableSets = availableSets.filter(set => set.setNumber !== excludeSet);
      }

      if (availableSets.length === 0) {
        return res.status(400).json({ message: "No more sets available" });
      }

      // Pick setNumber if provided, else random
      let newAssignedSet;
      if (setNumber) {
        newAssignedSet = availableSets.find(set => set.setNumber === setNumber);
      }
      if (!newAssignedSet) {
        newAssignedSet = availableSets[Math.floor(Math.random() * availableSets.length)];
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
          correct: false
        })),
        lastAccessed: new Date()
      };

      await user.save();
      res.json(enrollment);

    } catch (err) {
      console.error("Error assigning set:", err);
      res.status(500).json({ message: "Error assigning assignment set" });
    }
});

// Get course progress (this should be AFTER more specific routes)
router.get("/:courseId", authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const user = await User.findById(req.user._id);
    const enrollment = user.enrolledCourses.find(
      e => e.course.toString() === courseId
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
          lastAccessed: new Date()
        })),
        assignment: {
          assignedSetNumber: null,
          status: "not_started",
          submission: [],
          score: 0,
          questionsProgress: []
        }
      }));
      await user.save();
    }

    res.json(enrollment);
  } catch (err) {
    console.error("Error fetching progress:", err);
    res.status(500).json({ message: "Error fetching progress" });
  }
});

// Add this route BEFORE the other routes
router.post("/:courseId/unit/:unitIndex/lesson/:lessonIndex", 
  authMiddleware,
  async (req, res) => {
    try {
      const { courseId, unitIndex, lessonIndex } = req.params;
      const { completed, resourceId, resourceProgress } = req.body;

      const user = await User.findById(req.user._id);
      const enrollment = user.enrolledCourses.find(
        e => e.course.toString() === courseId
      );

      if (!enrollment) {
        return res.status(404).json({ message: "Not enrolled in this course" });
      }

      // Initialize unit progress if needed
      if (!enrollment.unitsProgress[unitIndex]) {
        enrollment.unitsProgress[unitIndex] = {
          unitIndex: parseInt(unitIndex),
          completed: false,
          lessonsCompleted: [],
          assignment: null,
          lastAccessed: new Date()
        };
      }

      // Initialize lesson progress if needed
      if (!enrollment.unitsProgress[unitIndex].lessonsCompleted[lessonIndex]) {
        enrollment.unitsProgress[unitIndex].lessonsCompleted[lessonIndex] = {
          lessonIndex: parseInt(lessonIndex),
          completed: false,
          resourcesProgress: [],
          lastAccessed: new Date()
        };
      }

      const lesson = enrollment.unitsProgress[unitIndex].lessonsCompleted[lessonIndex];

      // Update lesson completion status
      if (completed !== undefined) {
        lesson.completed = completed;
      }
      
      lesson.lastAccessed = new Date();

      // Update resource progress if provided
      if (resourceId && resourceProgress) {
        const resourceProgressIndex = lesson.resourcesProgress.findIndex(
          rp => rp.resourceId === resourceId
        );

        if (resourceProgressIndex > -1) {
          lesson.resourcesProgress[resourceProgressIndex] = {
            ...lesson.resourcesProgress[resourceProgressIndex],
            ...resourceProgress,
            lastAccessed: new Date()
          };
        } else {
          lesson.resourcesProgress.push({
            resourceId,
            ...resourceProgress,
            lastAccessed: new Date()
          });
        }
      }

      // Check if all lessons in the unit are completed
      const unit = enrollment.unitsProgress[unitIndex];
      const allLessonsCompleted = unit.lessonsCompleted.every(l => l.completed);

      // If all lessons are completed and there's no assignment or assignment is completed
      if (allLessonsCompleted && (!unit.assignment || unit.assignment.status === 'submitted')) {
        unit.completed = true;
      }

      // Update overall course progress
      enrollment.progress = Math.round(
        (enrollment.unitsProgress.filter(u => u.completed).length / 
         enrollment.unitsProgress.length) * 100
      );

      await user.save();
      res.json(enrollment);
    } catch (err) {
      console.error("Error updating lesson progress:", err);
      res.status(500).json({ message: "Error updating lesson progress" });
    }
});

module.exports = router;