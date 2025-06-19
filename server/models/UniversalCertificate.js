const mongoose = require("mongoose");

const universalCertificateSchema = new mongoose.Schema({
  templateBase64: { type: String },
  templateUrl: { type: String }, // Cloudinary URL
  templateStoragePath: { type: String }, // Cloudinary public_id
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
      qrSize: { type: Number, default: 80 }
    }
  }
});

module.exports = mongoose.model("UniversalCertificate", universalCertificateSchema);