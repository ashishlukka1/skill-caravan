const mongoose = require("mongoose");

const resourceProgressSchema = new mongoose.Schema(
  {
    resourceId: String,
    completed: { type: Boolean, default: false },
    watchTime: { type: Number, default: 0 },
    lastAccessed: { type: Date, default: Date.now },
  },
  { _id: false }
);

const lessonProgressSchema = new mongoose.Schema(
  {
    lessonIndex: Number,
    completed: { type: Boolean, default: false },
    resourcesProgress: [resourceProgressSchema],
    lastAccessed: { type: Date, default: Date.now },
  },
  { _id: false }
);

const questionProgressSchema = new mongoose.Schema(
  {
    questionIndex: Number,
    answered: { type: Boolean, default: false },
    selectedOption: Number,
    correct: { type: Boolean, default: false },
  },
  { _id: false }
);

const assignmentProgressSchema = new mongoose.Schema(
  {
    assignedSetNumber: { type: Number, default: null },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "submitted"],
      default: "not_started",
    },
    submission: [Number],
    score: { type: Number, default: 0 },
    attemptCount: { type: Number, default: 0 },
    questionsProgress: [questionProgressSchema],
    lastAccessed: { type: Date, default: Date.now },
  },
  { _id: false }
);

const unitProgressSchema = new mongoose.Schema(
  {
    unitIndex: Number,
    completed: { type: Boolean, default: false },
    lessonsCompleted: [lessonProgressSchema],
    assignment: assignmentProgressSchema,
    lastAccessed: { type: Date, default: Date.now },
  },
  { _id: false }
);

const enrollmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrolledAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "completed", "dropped"],
      default: "active",
    },
    progress: { type: Number, default: 0 },
    unitsProgress: [unitProgressSchema],
    certificate: {
      issued: { type: Boolean, default: false },
      issuedAt: Date,
      certificateId: String,
      certificateUrl: String,
      storageUrl: String,
    },
    assignedByAdmin: { type: Boolean, default: false }, 
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
role: {
  type: String,
  enum: ["Employee", "instructor", "admin", "checker"],
  required: true,
},
  employeeId: { type: String, required: true },
  mobile: String,
  team: String,
  designation: String,
  createdCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  enrolledCourses: [enrollmentSchema],
  dateJoined: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);