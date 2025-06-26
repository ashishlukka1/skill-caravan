const mongoose = require("mongoose");

const universalCertificateSchema = new mongoose.Schema({
  templateBase64: { type: String },
  templateUrl: { type: String },
  templateStoragePath: { type: String },
  textSettings: {
    nameBox: {
      x: { type: Number },
      y: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    courseBox: {
      x: { type: Number },
      y: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    dateBox: {
      x: { type: Number },
      y: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    qrBox: {
      x: { type: Number },
      y: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    font: {
      family: { type: String, default: "Arial" },
      color: { type: String, default: "#000000" },
      nameSize: { type: Number, default: 32 },
      courseSize: { type: Number, default: 32 },
      dateSize: { type: Number, default: 32 },
      qrSize: { type: Number, default: 80 },
    },
  },
});

module.exports = mongoose.model(
  "UniversalCertificate",
  universalCertificateSchema
);
