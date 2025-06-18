const mongoose = require("mongoose");
const questionSchema = require("./questionSchema");

const assignmentSetSchema = new mongoose.Schema({
  setNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  title: { type: String, required: true },
  description: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  questions: [questionSchema],
  maxAttempts: { type: Number, default: 1 }
}, { _id: false });

const assignmentSchema = new mongoose.Schema({
  assignmentSets: {
    type: [assignmentSetSchema],
    required: true
  }
}, { _id: false });

module.exports = assignmentSchema;