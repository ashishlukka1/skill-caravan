const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['video_url', 'video_file', 'document'],
    required: true
  },
  title: { type: String, required: true },
  url: String, 
  fileDetails: {
    originalName: String,
    fileName: String,
    contentType: String,
    size: Number,
    firebaseStoragePath: String,
    uploadDate: { type: Date, default: Date.now }
  }
}, { _id: false });

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  resources: [resourceSchema],
  duration: Number
}, { _id: false });

module.exports = lessonSchema;