const mongoose = require("mongoose");
const unitSchema = require("./unitSchema");

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: "Other",
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    default: "Beginner",
  },
  units: [unitSchema],
  thumbnail: {
    type: String,
    default: "",
  },
  duration: {
    type: Number,
    default: 0,
  },
  tags: [String],
  studentsEnrolled: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  certificate: {
    templateUrl: String,
    templateStoragePath: String,
    textSettings: {
      namePosition: { x: Number, y: Number },
      coursePosition: { x: Number, y: Number },
      datePosition: { x: Number, y: Number },
      qrPosition: { x: Number, y: Number },
      font: {
        family: { type: String, default: "Arial" },
        color: { type: String, default: "#000000" },
        nameSize: { type: Number, default: 32 },
        courseSize: { type: Number, default: 32 },
        dateSize: { type: Number, default: 32 },
        qrSize: { type: Number, default: 80 },
      },
    },
  },
  ratings: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rating: { type: Number, min: 1, max: 5 },
      review: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  averageRating: {
    type: Number,
    default: 0,
  },
  published: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Course", courseSchema);
