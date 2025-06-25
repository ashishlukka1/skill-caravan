const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const {
  authMiddleware,
  isInstructor,
  isInstructorOrAdmin,
  isAdmin,
} = require("../middleware/auth");
const Course = require("../models/Course");
const User = require("../models/User");
const multer = require("multer");
const sharp = require("sharp");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const UniversalCertificate = require("../models/UniversalCertificate");
const generateCertificateForUser = require("../utils/generateCertificateForUser.js");

// Only ONE multer instance!
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

const getBase64 = (buffer, mimetype) => {
  return `data:${mimetype};base64,${buffer.toString('base64')}`;
};


// --- UNIVERSAL CERTIFICATE GET ---
router.get("/universal", async (req, res) => {
  try {
    const cert = await UniversalCertificate.findOne();
    if (!cert)
      return res.status(404).json({ message: "No universal certificate set" });
    res.json(cert);
  } catch (err) {
    console.error("Error fetching universal certificate:", err);
    res.status(500).json({ message: "Failed to fetch universal certificate" });
  }
});

// --- SEARCH ---
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q?.trim() || "";
    const limit = parseInt(req.query.limit) || 8;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    let titleMatches = await Course.find({
      title: { $regex: q, $options: "i" },
    })
      .populate({ path: "instructor", select: "name" })
      .select(
        "title instructor tags duration level thumbnail price isPaid rating reviewCount category"
      )
      .limit(limit);

    if (titleMatches.length < limit) {
      const excludeIds = titleMatches.map((c) => c._id);
      const otherMatches = await Course.find({
        _id: { $nin: excludeIds },
        $or: [
          { tags: { $regex: q, $options: "i" } },
          { category: { $regex: q, $options: "i" } },
        ],
      })
        .populate({ path: "instructor", select: "name" })
        .select(
          "title instructor tags duration level thumbnail price isPaid rating reviewCount category"
        )
        .limit(limit - titleMatches.length);

      titleMatches = titleMatches.concat(otherMatches);
    }

    res.json(titleMatches);
  } catch (err) {
    console.error("Course search error:", err);
    res.status(500).json({ message: "Error searching courses" });
  }
});

// --- TEST USER ---
router.get("/test-user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "User fetch failed", error: err.message });
  }
});

// --- LIST ALL COURSES ---
router.get("/", async (req, res) => {
  try {
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Only select summary fields
    const courses = await Course.find({}, "title thumbnail difficulty description createdAt studentsEnrolled averageRating certificate units category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments();
    res.json({ courses, total });
  } catch (err) {
    res.status(500).json({ message: "Error fetching courses" });
  }
});

// --- COURSE CATEGORIES ---
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

// --- ASSIGNMENT SUBMISSION & CERTIFICATE GENERATION ---
router.post(
  "/:courseId/assignment/:unitIndex/submit",
  authMiddleware,
  async (req, res) => {
    try {
      const { courseId, unitIndex } = req.params;
      const { submission } = req.body;

      const course = await Course.findById(courseId);
      const user = await User.findById(req.user._id);
      const enrollment = user.enrolledCourses.find(
        (e) => e.course.toString() === courseId
      );

      if (!enrollment) return res.status(404).json({ message: "Not enrolled in this course" });

      const unitProgress = enrollment.unitsProgress[unitIndex];
      if (!unitProgress || !unitProgress.assignment) {
        return res.status(404).json({ message: "Assignment not initialized for this unit" });
      }

      const assignedSetNumber = unitProgress.assignment.assignedSetNumber;
      const assignmentSets = course.units[unitIndex].assignment.assignmentSets;
      let assignmentSet = assignmentSets.find(
        (set) => set.setNumber === assignedSetNumber
      );

      if (!assignmentSet && assignmentSets.length === 1) {
        assignmentSet = assignmentSets[0];
      }

      if (!assignmentSet) {
        return res.status(404).json({ message: "Assignment set not found" });
      }

      let score = 0;
      const totalPossibleScore = assignmentSet.questions.reduce(
        (acc, q) => acc + q.marks,
        0
      );

      submission.forEach((answer, idx) => {
        const question = assignmentSet.questions[idx];
        if (
          question &&
          answer?.toString() === question.correctAnswer?.toString()
        ) {
          score += question.marks;
        }
      });

      unitProgress.assignment.status = "submitted";
      unitProgress.assignment.submittedAt = new Date();
      unitProgress.assignment.submission = submission;
      unitProgress.assignment.score = score;
      unitProgress.assignment.attemptCount =
        (unitProgress.assignment.attemptCount || 0) + 1;

      if (score === totalPossibleScore) {
        unitProgress.completed = true;
        unitProgress.assignment.status = "submitted";
        // unitProgress.assignment.assignedSetNumber = null;

        enrollment.progress = Math.round(
          (enrollment.unitsProgress.filter((u) => u.completed).length /
            enrollment.unitsProgress.length) *
            100
        );

        if (enrollment.progress === 100) {
          enrollment.status = "completed";
          if (!enrollment.certificate || !enrollment.certificate.issued) {
            try {
              const certObj = await generateCertificateForUser({
                user,
                course,
              });
              enrollment.certificate = certObj;
            } catch (err) {
              console.error("Certificate generation error:", err);
              return res
                .status(500)
                .json({ message: "Certificate generation failed" });
            }
          }
        }
      } else {
        unitProgress.completed = false;
      }

      user.markModified("enrolledCourses");
      await user.save();

      res.json({
        message:
          score === totalPossibleScore
            ? "Perfect score achieved!"
            : "Assignment submitted",
        score,
        totalScore: totalPossibleScore,
        isPerfect: score === totalPossibleScore,
        progress: enrollment.progress,
      });
    } catch (err) {
      console.error("Error submitting assignment:", err);
      res.status(500).json({ message: "Error submitting assignment" });
    }
  }
);

// --- ENROLLMENT STATUS ---
router.get("/:id/enrollment-status", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isEnrolled = user.enrolledCourses.some(
      (enrollment) => enrollment.course.toString() === req.params.id
    );
    res.json({ isEnrolled });
  } catch (err) {
    console.error("Error checking enrollment status:", err);
    res.status(500).json({ message: "Error checking enrollment status" });
  }
});

// --- ENROLL IN COURSE (TRANSACTION SAFE) ---
router.post("/:id/enroll", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let enrollmentResult = null;
    await session.withTransaction(async () => {
      const [course, user] = await Promise.all([
        Course.findById(req.params.id).session(session),
        User.findById(req.user._id).session(session),
      ]);

      if (!course) throw new Error("Course not found");
      if (!user) throw new Error("User not found");

      if (
        user.enrolledCourses.some(
          (e) => e.course.toString() === course._id.toString()
        )
      ) {
        throw new Error("Already enrolled in this course");
      }

      const enrollment = {
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
      };

      user.enrolledCourses.push(enrollment);

      if (
        !course.studentsEnrolled.some(
          (id) => id.toString() === user._id.toString()
        )
      ) {
        course.studentsEnrolled.push(user._id);
      }

      await Promise.all([user.save({ session }), course.save({ session })]);
      enrollmentResult = enrollment;
    });

    res.status(201).json({
      message: "Successfully enrolled in course",
      enrollment: enrollmentResult,
    });
  } catch (err) {
    let status = 500;
    if (err.message === "Course not found" || err.message === "User not found") status = 404;
    if (err.message === "Already enrolled in this course") status = 400;
    res.status(status).json({ message: err.message || "Error enrolling in course" });
  } finally {
    session.endSession();
  }
});

// --- GET COURSE BY ID ---
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "instructor",
      "name email"
    );
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Only allow enrolled users to access full content
    const user = await User.findById(req.user._id);
    const isEnrolled = user.enrolledCourses.some(
      (enrollment) => enrollment.course.toString() === req.params.id
    );
    if (!isEnrolled) {
      // Return only public info
      return res.json({
        _id: course._id,
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        thumbnail: course.thumbnail,
        studentsEnrolled: course.studentsEnrolled,
        instructor: course.instructor,
        duration: course.duration,
        // Do NOT include units/lessons!
      });
    }

    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Error fetching course" });
  }
});

// --- CREATE COURSE (DEFAULT CERTIFICATE FROM UNIVERSAL) ---
router.post("/", authMiddleware, isInstructorOrAdmin, async (req, res) => {
  try {
    const { title, description, units } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    let universalCert = await UniversalCertificate.findOne();

    // Ensure units and lessons are always arrays
    const safeUnits = (units || []).map((unit) => ({
      title: unit.title,
      lessons: (unit.lessons || []).map((lesson) => ({
        title: lesson.title,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        duration: parseInt(lesson.duration) || 0,
        resources: lesson.resources || [],
      })),
      assignment: unit.assignment
        ? {
            assignmentSets: (unit.assignment.assignmentSets || []).map(
              (set, idx) => ({
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
              })
            ),
          }
        : undefined,
    }));

    const courseData = {
      title,
      description,
      category: req.body.category || "Other",
      difficulty: req.body.difficulty || "Beginner",
      thumbnail: req.body.thumbnail || "",
      tags: req.body.tags || [],
      instructor: req.user._id,
      duration: 0,
      units: safeUnits, // <-- Always use the processed units
      certificate: universalCert
        ? {
            templateUrl: universalCert.templateUrl,
            textSettings: universalCert.textSettings,
          }
        : undefined,
    };

    const course = new Course(courseData);
    await course.save();

    res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (err) {
    console.error("Course creation error:", err);
    res.status(500).json({
      message: "Error creating course",
      error:
        process.env.NODE_ENV === "development"
          ? err.toString()
          : "Server error",
    });
  }
});

// --- DELETE COURSE ---
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

// --- ASSIGN COURSE TO USERS/TEAM (ADMIN) ---
router.post("/:id/assign", authMiddleware, async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const { type, users, team } = req.body;
    const courseId = req.params.id;

    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can assign courses" });
    }

    const course = await Course.findById(courseId).session(session);
    if (!course) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Course not found" });
    }

    let usersToEnroll = [];
    if (type === "user" && users?.length) {
      const selectedUsers = await User.find({
        _id: { $in: users },
        "enrolledCourses.course": { $ne: courseId },
      }).session(session);
      usersToEnroll = selectedUsers;
    } else if (type === "team" && team) {
      const teamUsers = await User.find({
        team,
        "enrolledCourses.course": { $ne: courseId },
      }).session(session);
      usersToEnroll = teamUsers;
    }

    if (!usersToEnroll.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "User already enrolled in this course.",
      });
    }

    const updates = usersToEnroll.map(async (user) => {
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
            lastAccessed: new Date(),
          })),
          assignment:
            unit.assignment?.assignmentSets?.length > 0
              ? {
                  assignedSetNumber: null,
                  status: "not_started",
                  submission: [],
                  score: 0,
                  questionsProgress: [],
                }
              : null,
          lastAccessed: new Date(),
        })),
      };

      user.enrolledCourses.push(enrollment);

      if (!course.studentsEnrolled.includes(user._id)) {
        course.studentsEnrolled.push(user._id);
      }

      return user.save({ session });
    });

    await Promise.all([...updates, course.save({ session })]);
    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "Course assigned successfully",
      assignedCount: usersToEnroll.length,
      totalSelected: type === "user" ? users.length : "all team members",
    });
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (e) {}
    }
    console.error("Course assignment error:", err);
    res.status(500).json({
      message: "Error assigning course",
      error:
        process.env.NODE_ENV === "development" ? err.toString() : undefined,
    });
  }
});

// --- UPDATE COURSE ---
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const updates = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can edit courses" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

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

    if (updates.units) {
      course.units = updates.units.map((unit) => ({
        title: unit.title,
        lessons: (unit.lessons || []).map((lesson) => ({
          title: lesson.title,
          content: lesson.content,
          videoUrl: lesson.videoUrl,
          duration: parseInt(lesson.duration) || 0,
          resources: lesson.resources || [],
        })),
        assignment: {
          assignmentSets: (unit.assignment?.assignmentSets || []).map(
            (set, idx) => ({
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
            })
          ),
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

// --- RESOURCE UPLOAD (VIDEO/DOCUMENT) ---
router.post(
  "/:courseId/units/:unitIndex/lessons/:lessonIndex/resources",
  upload.single("file"),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const unitIndex = Number(req.params.unitIndex);
      const lessonIndex = Number(req.params.lessonIndex);
      const { type, title, url } = req.body;
      let resourceData = { type, title };

      if (type === "video_url" || type === "document_url") {
        if (!url) return res.status(400).json({ message: "URL is required." });
        resourceData.url = url;
      } else if (type === "video_file" && req.file) {
        // Upload video to Cloudinary
        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          "course-videos",
          `${Date.now()}-${req.file.originalname}`,
          req.file.mimetype
        );
        resourceData.url = uploadResult.secure_url;
        resourceData.fileDetails = {
          originalName: req.file.originalname,
          contentType: req.file.mimetype,
          size: req.file.size,
          uploadDate: new Date(),
          cloudinaryPublicId: uploadResult.public_id,
        };
      } else if (type === "document" && req.file) {
        // Store document as base64 (for small files)
        resourceData.url = getBase64(req.file.buffer, req.file.mimetype);
        resourceData.fileDetails = {
          originalName: req.file.originalname,
          contentType: req.file.mimetype,
          size: req.file.size,
          uploadDate: new Date(),
        };
      } else {
        return res.status(400).json({ message: "File or URL is required." });
      }

      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });

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

// --- COURSE CERTIFICATE TEMPLATE UPLOAD ---
router.post(
  "/:id/certificate-template",
  authMiddleware,
  isAdmin,
  upload.single("template"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { namePosition, font } = req.body;

      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      let templateUrl = course.certificate?.templateUrl;
      let templateStoragePath = course.certificate?.templateStoragePath;

      if (req.file) {
        let buffer = req.file.buffer;
        let mimeType = req.file.mimetype;
        if (!mimeType.startsWith("image/png")) {
          buffer = await sharp(buffer).png().toBuffer();
          mimeType = "image/png";
        }
        const uploadResult = await uploadToCloudinary(
          buffer,
          `courses/${id}/certificate`,
          `certificate-template-${Date.now()}.png`,
          "image/png"
        );
        templateUrl = uploadResult.secure_url;
        templateStoragePath = uploadResult.public_id;
      } else if (!templateUrl) {
        return res
          .status(400)
          .json({ message: "Certificate template file is required" });
      }

      let parsedNamePosition, parsedFont;
      try {
        parsedNamePosition = JSON.parse(namePosition);
        parsedFont = JSON.parse(font);
      } catch (e) {
        return res
          .status(400)
          .json({ message: "Invalid certificate text settings" });
      }

      course.certificate = {
        templateUrl,
        templateStoragePath,
        textSettings: {
          namePosition: parsedNamePosition,
          font: parsedFont,
        },
      };

      await course.save();

      res.json({
        message: "Certificate template updated successfully",
        certificate: course.certificate,
      });
    } catch (err) {
      console.error("Certificate template upload error:", err);
      res.status(500).json({
        message: "Error uploading certificate template",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }
);

// --- MY CERTIFICATES ---
router.get("/my-courses/my-certificates", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "enrolledCourses.course",
      select: "title",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const enrolledCourses = user.enrolledCourses || [];
    const certificates = [];

    enrolledCourses.forEach((enroll) => {
      try {
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
            certificateId:
              enroll.certificate.certificateId ||
              `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          });
        }
      } catch (innerErr) {
        console.error("Error processing individual certificate:", innerErr);
      }
    });

    res.json({ certificates });
  } catch (err) {
    console.error("Error in /my-certificates:", err.stack || err);
    res.status(500).json({
      message: "Failed to fetch certificates",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
});

// --- UNIVERSAL CERTIFICATE UPLOAD ---
router.post("/universal", upload.single("template"), async (req, res) => {
  try {
    const { textSettings } = req.body;
    let cert = await UniversalCertificate.findOne();

    // If a new file is uploaded, update the template
    if (req.file) {
      let buffer = req.file.buffer;
      let mimeType = req.file.mimetype;
      if (!mimeType.startsWith("image/png")) {
        buffer = await sharp(buffer).png().toBuffer();
        mimeType = "image/png";
      }
      const uploadResult = await uploadToCloudinary(
        buffer,
        "universal-certificates",
        `universal-certificate-template-${Date.now()}.png`,
        "image/png"
      );
      if (cert) {
        cert.templateUrl = uploadResult.secure_url;
        cert.templateStoragePath = uploadResult.public_id;
      } else {
        cert = new UniversalCertificate({
          templateUrl: uploadResult.secure_url,
          templateStoragePath: uploadResult.public_id,
        });
      }
    } else if (!cert) {
      // No file and no existing cert
      return res.status(400).json({ message: "Template file is required" });
    }

    // Always update textSettings if provided
    if (textSettings) {
      cert.textSettings = JSON.parse(textSettings);
    }

    await cert.save();
    res.json({ message: "Universal certificate updated", cert });
  } catch (err) {
    res.status(500).json({ message: "Failed to update universal certificate" });
  }
});

// --- VALIDATE CERTIFICATE ---
router.get("/validate-certificate/:certId", async (req, res) => {
  const users = await User.find({
    "enrolledCourses.certificate.certificateId": req.params.certId,
  }).populate("enrolledCourses.course", "title");
  if (!users.length)
    return res.status(404).send("Certificate not found or not valid.");
  const user = users[0];
  const enrollment = user.enrolledCourses.find(
    (e) => e.certificate?.certificateId === req.params.certId
  );
 res.json({
    valid: true,
    userName: user.name,
    courseTitle: enrollment?.course?.title || "Course",
    certificateUrl: enrollment?.certificate?.certificateUrl,
    certificateId: enrollment?.certificate?.certificateId,
    issuedAt: enrollment?.certificate?.issuedAt,
  });
});

module.exports = router;