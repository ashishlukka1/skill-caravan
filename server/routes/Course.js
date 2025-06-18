const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { authMiddleware, isInstructor, isInstructorOrAdmin, isAdmin } = require("../middleware/auth");
const Course = require("../models/Course");
const User = require("../models/User");
const multer = require('multer');
const generateAndUploadCertificate = require("../utils/generateAndUploadCertificate");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// Only ONE multer instance!
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 
  }
});


router.get("/search", async (req, res) => {
  try {
    const q = req.query.q?.trim() || "";
    const limit = parseInt(req.query.limit) || 8;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    // 1. Find courses where the title matches
    let titleMatches = await Course.find({
      title: { $regex: q, $options: "i" }
    })
      .populate({ path: "instructor", select: "name" })
      .select("title instructor tags duration level thumbnail price isPaid rating reviewCount category")
      .limit(limit);

    // 2. If not enough, find more by tags/category (excluding already found)
    if (titleMatches.length < limit) {
      const excludeIds = titleMatches.map(c => c._id);
      const otherMatches = await Course.find({
        _id: { $nin: excludeIds },
        $or: [
          { tags: { $regex: q, $options: "i" } },
          { category: { $regex: q, $options: "i" } }
        ]
      })
        .populate({ path: "instructor", select: "name" })
        .select("title instructor tags duration level thumbnail price isPaid rating reviewCount category")
        .limit(limit - titleMatches.length);

      titleMatches = titleMatches.concat(otherMatches);
    }

    res.json(titleMatches);
  } catch (err) {
    console.error("Course search error:", err);
    res.status(500).json({ message: "Error searching courses" });
  }
});


router.get("/test-user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "User fetch failed", error: err.message });
  }
});


// List all published courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .select("-units.assignment.assignmentSets.questions");
    res.json(courses);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ message: "Error fetching courses" });
  }
});


router.get("/categories", async (req, res) => {
  res.json([
    "Web Development",
    "Data Science",
    "AI/ML",
    "Cloud",
    "Cybersecurity",
    "Finance",
    "HR",
    "Marketing",
    "DevOps",
    "Design",
    "Other",
  ]);
});


router.post("/:courseId/assignment/:unitIndex/submit", authMiddleware, async (req, res) => {
  try {
    const { courseId, unitIndex } = req.params;
    const { submission } = req.body;

    const course = await Course.findById(courseId);
    const user = await User.findById(req.user._id);
    const enrollment = user.enrolledCourses.find(e => e.course.toString() === courseId);

    if (!enrollment) return res.status(404).json({ message: "Not enrolled in this course" });

    const unitProgress = enrollment.unitsProgress[unitIndex];
    if (!unitProgress || !unitProgress.assignment) {
      return res.status(404).json({ message: "Assignment not initialized for this unit" });
    }

    const assignedSetNumber = unitProgress.assignment.assignedSetNumber;
    const assignmentSets = course.units[unitIndex].assignment.assignmentSets;
    let assignmentSet = assignmentSets.find(set => set.setNumber === assignedSetNumber);

    // Defensive: If only one set, always use it
    if (!assignmentSet && assignmentSets.length === 1) {
      assignmentSet = assignmentSets[0];
    }

    if (!assignmentSet) {
      return res.status(404).json({ message: "Assignment set not found" });
    }

    // Calculate score
    let score = 0;
    const totalPossibleScore = assignmentSet.questions.reduce((acc, q) => acc + q.marks, 0);

    submission.forEach((answer, idx) => {
      const question = assignmentSet.questions[idx];
      if (question && answer?.toString() === question.correctAnswer?.toString()) {
        score += question.marks;
      }
    });

    // Update assignment progress
    unitProgress.assignment.status = "submitted";
    unitProgress.assignment.submittedAt = new Date();
    unitProgress.assignment.submission = submission;
    unitProgress.assignment.score = score;
    unitProgress.assignment.attemptCount = (unitProgress.assignment.attemptCount || 0) + 1;

    // If perfect score, mark unit as completed
    if (score === totalPossibleScore) {
      unitProgress.completed = true;
      unitProgress.assignment.status = "submitted";
      unitProgress.assignment.assignedSetNumber = null; // Prevent further attempts

      // Update overall course progress
      enrollment.progress = Math.round(
        (enrollment.unitsProgress.filter(u => u.completed).length /
          enrollment.unitsProgress.length) * 100
      );

      // If all units completed, mark course as completed
      if (enrollment.progress === 100) {
        enrollment.status = "completed";
      }

      // Certificate logic
      if (
        enrollment.progress === 100 &&
        (!enrollment.certificate || !enrollment.certificate.issued)
      ) {
        const courseWithCert = await Course.findById(courseId);
        if (
          courseWithCert.certificate &&
          courseWithCert.certificate.templateUrl &&
          courseWithCert.certificate.textSettings
        ) {
          try {
            const certResult = await generateAndUploadCertificate(
              courseWithCert.certificate.templateUrl,
              courseWithCert.certificate.textSettings,
              user.name, 
              `certificates/${user._id}`
            );
            enrollment.certificate = {
              issued: true,
              issuedAt: new Date(),
              certificateId: certResult.public_id,
              certificateUrl: certResult.url,
              storageUrl: certResult.public_id
            };
            await user.save();
          } catch (certErr) {
            console.error("Certificate generation error:", certErr);
          }
        }
      }
    } else {
      // Not perfect score: unit not completed, allow retry/other set
      unitProgress.completed = false;
    }

    await user.save();

    res.json({
      message: score === totalPossibleScore ? "Perfect score achieved!" : "Assignment submitted",
      score,
      totalScore: totalPossibleScore,
      isPerfect: score === totalPossibleScore,
      progress: enrollment.progress
    });

  } catch (err) {
    console.error("Error submitting assignment:", err);
    res.status(500).json({ message: "Error submitting assignment" });
  }
});



router.get("/:id/enrollment-status", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === req.params.id
    );
    
    res.json({ isEnrolled });
  } catch (err) {
    console.error("Error checking enrollment status:", err);
    res.status(500).json({ message: "Error checking enrollment status" });
  }
});


router.post("/:id/enroll", authMiddleware, async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const [course, user] = await Promise.all([
      Course.findById(req.params.id).session(session),
      User.findById(req.user._id).session(session)
    ]);

    if (!course) {
      throw new Error("Course not found");
    }

    // Check if user is already enrolled
    if (user.enrolledCourses.some(e => e.course.toString() === course._id.toString())) {
      throw new Error("Already enrolled in this course");
    }

    // Create enrollment structure
    const enrollment = {
      course: course._id,
      enrolledAt: new Date(),
      status: 'active',
      progress: 0,
      unitsProgress: course.units.map((unit, unitIndex) => ({
        unitIndex,
        completed: false,
        lessonsCompleted: unit.lessons.map((_, lessonIndex) => ({
          lessonIndex,
          completed: false,
          resourcesProgress: [],
          lastAccessed: new Date()
        })),
        assignment: unit.assignment?.assignmentSets?.length > 0 ? {
          assignedSetNumber: null,
          status: 'not_started',
          submission: [],
          score: 0,
          attemptCount: 0,
          questionsProgress: [],
          lastAccessed: new Date()
        } : null,
        lastAccessed: new Date()
      }))
    };

    // Push enrollment to user
    user.enrolledCourses.push(enrollment);

    // Push user ID to course only if not already enrolled
    if (!course.studentsEnrolled.some(id => id.toString() === user._id.toString())) {
      course.studentsEnrolled.push(user._id);
    }

    // Save both documents within transaction
    await Promise.all([
      user.save({ session }),
      course.save({ session })
    ]);

    await session.commitTransaction();

    res.status(201).json({
      message: "Successfully enrolled in course",
      enrollment
    });

  } catch (err) {
    if (session) {
      await session.abortTransaction();
    }

    console.error("Enrollment error:", err);
    res.status(
      err.message === "Course not found" ? 404 :
      err.message === "Already enrolled in this course" ? 400 : 500
    ).json({
      message: err.message || "Error enrolling in course"
    });

  } finally {
    if (session) {
      session.endSession();
    }
  }
});



router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "instructor",
      "name email"
    );
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Error fetching course" });
  }
});



router.post("/", authMiddleware, isInstructorOrAdmin, async (req, res) => {
  try {
    const { title, description, units } = req.body;
    
    // Basic validation
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    // Create course object with minimum required fields
    const courseData = {
      title,
      description,
      category: req.body.category || 'Other',
      difficulty: req.body.difficulty || 'Beginner',
      thumbnail: req.body.thumbnail || '',
      tags: req.body.tags || [],
      instructor: req.user._id,
      duration: 0,
      units: []
    };

    // Add units if provided
    if (units && Array.isArray(units)) {
      courseData.units = units.map(unit => ({
        title: unit.title,
        lessons: unit.lessons?.map(lesson => ({
          title: lesson.title,
          content: lesson.content || '',
          videoUrl: lesson.videoUrl || '',
          duration: parseInt(lesson.duration) || 0,
          resources: []
        })) || [],
        assignment: {
          assignmentSets: unit.assignment?.assignmentSets?.map(set => ({
            setNumber: parseInt(set.setNumber),
            title: set.title,
            description: set.description || '',
            difficulty: set.difficulty || 'easy',
            questions: set.questions?.map(q => ({
              questionText: q.questionText,
              options: q.options?.filter(opt => opt?.trim()) || [],
              correctAnswer: parseInt(q.correctAnswer) || 0,
              marks: parseInt(q.marks) || 1
            })) || []
          })) || []
        }
      }));

      // Calculate total duration
      courseData.duration = courseData.units.reduce((total, unit) => 
        total + unit.lessons.reduce((sum, lesson) => 
          sum + (parseInt(lesson.duration) || 0), 0), 0);
    }

    // Create and save the course
    const course = new Course(courseData);
    await course.save();

    res.status(201).json({
      message: "Course created successfully",
      course
    });

  } catch (err) {
    console.error("Course creation error:", err);
    res.status(500).json({
      message: "Error creating course",
      error: process.env.NODE_ENV === "development" ? err.toString() : "Server error"
    });
  }
});


// Instructor: Delete course
router.delete("/:id", authMiddleware, isInstructor, async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({
      _id: req.params.id,
      instructor: req.user._id,
    });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting course" });
  }
});


// Update the assignment route
router.post("/:id/assign", authMiddleware, async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const { type, users, team } = req.body;
    const courseId = req.params.id;

    // Verify user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can assign courses" });
    }

    // Find the course with session
    const course = await Course.findById(courseId).session(session);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Find eligible users based on type
    let usersToEnroll = [];
    if (type === "user" && users?.length) {
      const selectedUsers = await User.find({ 
        _id: { $in: users },
        'enrolledCourses.course': { $ne: courseId } // Not already enrolled
      }).session(session);
      usersToEnroll = selectedUsers;
    } else if (type === "team" && team) {
      const teamUsers = await User.find({ 
        team,
        'enrolledCourses.course': { $ne: courseId } // Not already enrolled
      }).session(session);
      usersToEnroll = teamUsers;
    }

    if (!usersToEnroll.length) {
      return res.status(400).json({
        message: "User already enrolled in this course."
      });
    }

    // Process enrollments
    const updates = usersToEnroll.map(async (user) => {
      // Create enrollment structure
      const enrollment = {
        course: courseId,
        enrolledAt: new Date(),
        status: "active",
        progress: 0,
        unitsProgress: course.units.map((unit, unitIndex) => ({
          unitIndex,
          completed: false,
          lessonsCompleted: unit.lessons.map((_, lessonIndex) => ({
            lessonIndex,
            completed: false,
            resourcesProgress: [],
            lastAccessed: new Date()
          })),
          assignment: unit.assignment?.assignmentSets?.length > 0 ? {
            assignedSetNumber: null,
            status: "not_started",
            submission: [],
            score: 0,
            questionsProgress: []
          } : null,
          lastAccessed: new Date()
        }))
      };

      // Add enrollment to user
      user.enrolledCourses.push(enrollment);

      // Add user to course's enrolled students if not already there
      if (!course.studentsEnrolled.includes(user._id)) {
        course.studentsEnrolled.push(user._id);
      }

      return user.save({ session });
    });

    // Save all changes within transaction
    await Promise.all([
      ...updates,
      course.save({ session })
    ]);

    // Commit the transaction
    await session.commitTransaction();

    res.json({
      message: "Course assigned successfully",
      assignedCount: usersToEnroll.length,
      totalSelected: type === "user" ? users.length : "all team members"
    });

  } catch (err) {
    // Rollback on error
    if (session) {
      await session.abortTransaction();
    }
    console.error("Course assignment error:", err);
    res.status(500).json({
      message: "Error assigning course",
      error: process.env.NODE_ENV === "development" ? err.toString() : undefined
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
});


router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const updates = req.body;

    // Verify user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can edit courses" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Update allowed fields
    const allowedUpdates = [
      "title",
      "description",
      "category",
      "difficulty",
      "thumbnail",
      "tags",
      "duration",
      "units",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        course[field] = updates[field];
      }
    });

    // Handle units update specifically to maintain schema structure
    // Handle units update specifically to maintain schema structure
if (updates.units) {
  course.units = updates.units.map((unit) => ({
    title: unit.title,
    lessons: (unit.lessons || []).map((lesson) => ({
      title: lesson.title,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      duration: parseInt(lesson.duration) || 0,
      resources: lesson.resources || []
    })),
    assignment: {
      assignmentSets: (unit.assignment?.assignmentSets || []).map((set, idx) => ({
        setNumber: set.setNumber || idx + 1,
        title: set.title,
        description: set.description || "",
        difficulty: set.difficulty || "easy",
        questions: (set.questions || []).map((q) => ({
          questionText: q.questionText,
          options: (q.options || []).filter((opt) => opt && opt.trim()),
          correctAnswer: q.correctAnswer,
          marks: parseInt(q.marks) || 1,
        })),
      })),
    },
  }));
}

    await course.save();
    res.json({
      message: "Course updated successfully",
      course,
    });
  } catch (err) {
    console.error("Course update error:", err);
    res.status(500).json({
      message: "Error updating course",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});



router.post(
  "/:courseId/units/:unitIndex/lessons/:lessonIndex/resources",
  upload.single("file"),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      // Convert indices to numbers
      const unitIndex = Number(req.params.unitIndex);
      const lessonIndex = Number(req.params.lessonIndex);
      const { type, title, url } = req.body;
      let resourceData = { type, title };

      if (type === "video_url" || type === "document_url") {
        resourceData.url = url;
      } else if (req.file) {
        const folder = `courses/${courseId}/lessons/${lessonIndex}`;
        const filename = `${Date.now()}-${req.file.originalname}`;
        const result = await uploadToCloudinary(
          req.file.buffer,
          folder,
          filename,
          req.file.mimetype
        );
        resourceData.url = result.secure_url;
        resourceData.fileDetails = {
          public_id: result.public_id,
          resource_type: result.resource_type,
          size: result.bytes,
          format: result.format,
        };
      } else {
        return res.status(400).json({ message: "File or URL is required." });
      }

      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });

      // Defensive checks
      const unit = course.units[unitIndex];
      if (!unit) return res.status(404).json({ message: "Unit not found" });

      const lesson = unit.lessons[lessonIndex];
      if (!lesson) return res.status(404).json({ message: "Lesson not found" });

      if (!lesson.resources) lesson.resources = [];
      lesson.resources.push(resourceData);

      await course.save();

      res.json({ resource: resourceData });
    } catch (err) {
      console.error("Resource upload error:", err);
      res.status(500).json({ message: "Resource upload failed" });
    }
  }
);


router.post('/:id/certificate-template', 
  authMiddleware, 
  isAdmin,
  upload.single('template'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { namePosition, font } = req.body;

      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      let templateUrl = course.certificate?.templateUrl;
      let templateStoragePath = course.certificate?.templateStoragePath;

      // If a new file is uploaded, update the template in Cloudinary
      if (req.file) {
        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          `courses/${id}/certificate`,
          req.file.originalname,
          req.file.mimetype
        );
        templateUrl = uploadResult.secure_url;
        templateStoragePath = uploadResult.public_id;
      } else if (!templateUrl) {
        // No file uploaded and no previous template exists
        return res.status(400).json({ message: 'Certificate template file is required' });
      }

      let parsedNamePosition, parsedFont;
      try {
        parsedNamePosition = JSON.parse(namePosition);
        parsedFont = JSON.parse(font);
      } catch (e) {
        return res.status(400).json({ message: "Invalid certificate text settings" });
      }

      course.certificate = {
        templateUrl,
        templateStoragePath,
        textSettings: {
          namePosition: parsedNamePosition,
          font: parsedFont
        }
      };

      await course.save();

      res.json({ 
        message: 'Certificate template updated successfully',
        certificate: course.certificate 
      });

    } catch (err) {
      console.error('Certificate template upload error:', err);
      res.status(500).json({ 
        message: 'Error uploading certificate template',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
});


router.get("/my-courses/my-certificates", authMiddleware, async (req, res) => {
  try {
    // Allow Employees, admins, and instructors to view their certificates
    if (!["Employee", "admin", "instructor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied." });
    }

    const user = await User.findById(req.user._id).populate({
      path: "enrolledCourses.course",
      select: "title" // Only select the title field to optimize query
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize as empty array if undefined
    const enrolledCourses = user.enrolledCourses || [];

    if (!Array.isArray(enrolledCourses)) {
      return res.status(500).json({ message: "User enrolled courses data is corrupted" });
    }

    const certificates = [];
    
    enrolledCourses.forEach((enroll) => {
      try {
        // Add more robust checking
        if (
          enroll &&
          enroll.certificate &&
          enroll.certificate.issued === true &&
          enroll.certificate.certificateUrl
        ) {
          certificates.push({
            courseTitle: enroll.course?.title || "Course Deleted",
            certificateUrl: enroll.certificate.certificateUrl,
            issuedAt: enroll.certificate.issuedAt || null,
            certificateId: enroll.certificate.certificateId || `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          });
        }
      } catch (innerErr) {
        console.error("Error processing individual certificate:", innerErr);
        // Continue processing other certificates instead of failing completely
      }
    });

    res.json({ certificates });
  } catch (err) {
    console.error("Error in /my-certificates:", err.stack || err);
    res.status(500).json({ 
      message: "Failed to fetch certificates", 
      error: process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
    });
  }
});






module.exports = router;
