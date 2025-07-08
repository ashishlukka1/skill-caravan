const mongoose = require("mongoose");
const lessonSchema = require("./lessonSchema");
const assignmentSchema = require("./assignmentSchema");

const unitSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    lessons: [lessonSchema],
    assignment: assignmentSchema,
  },
  { _id: false }
);

module.exports = unitSchema;


