const { createCanvas, loadImage } = require("canvas");
const QRCode = require("qrcode");
const UniversalCertificate = require("../models/UniversalCertificate");
const uploadToCloudinary = require("./uploadToCloudinary");
const { v4: uuidv4 } = require("uuid");

/**
 * Generates a personalized certificate for a user and course.
 * Uses course.certificate.templateUrl (Cloudinary) if present,
 * otherwise falls back to universal certificate.
 * Uploads the generated certificate to Cloudinary and returns its URL and public_id.
 */
async function generateCertificateForUser({ user, course }) {
  let certId = uuidv4().slice(0, 8).toUpperCase();
  let certUrl = null;
  let storageUrl = null;
  let awardedAt = new Date();

  // Prefer course-specific certificate, fallback to universal
  let templateSrc, textSettings;
  if (
    course.certificate &&
    course.certificate.templateUrl &&
    course.certificate.textSettings
  ) {
    templateSrc = course.certificate.templateUrl;
    textSettings = course.certificate.textSettings;
  } else {
    // Use universal certificate as fallback
    const universalCert = await UniversalCertificate.findOne();
    if (!universalCert || !universalCert.templateUrl)
      throw new Error("No universal certificate set");
    templateSrc = universalCert.templateUrl;
    textSettings = universalCert.textSettings;
  }

  // Load template (Cloudinary URL)
  const image = await loadImage(templateSrc);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height);

  // Draw user name
  const font = textSettings.font || {};
  ctx.font = `bold ${font.nameSize || 32}px "${font.family || "Arial"}"`;
  ctx.fillStyle = font.color || "#000000";
  ctx.textAlign = "left";
  ctx.fillText(
    user.name,
    textSettings.namePosition.x,
    textSettings.namePosition.y + (font.nameSize || 32)
  );

  // Draw course name
  if (textSettings.coursePosition) {
    ctx.font = `bold ${font.courseSize || 28}px "${font.family || "Arial"}"`;
    ctx.fillText(
      course.title,
      textSettings.coursePosition.x,
      textSettings.coursePosition.y + (font.courseSize || 28)
    );
  }

  // Draw awarded date
  if (textSettings.datePosition) {
    ctx.font = `bold ${font.dateSize || 20}px "${font.family || "Arial"}"`;
    ctx.fillText(
      awardedAt.toLocaleDateString(),
      textSettings.datePosition.x,
      textSettings.datePosition.y + (font.dateSize || 20)
    );
  }

  // Draw QR code (validate URL)
  if (textSettings.qrPosition) {
    const qrUrl = `${process.env.PUBLIC_URL || "https://localhost:5173.com"}/validate-certificate/${certId}`;
    const qrSize = font.qrSize || 80;
    const qrBuffer = await QRCode.toBuffer(qrUrl, { width: qrSize, margin: 0 });
    const qrImage = await loadImage(qrBuffer);
    ctx.drawImage(
      qrImage,
      textSettings.qrPosition.x,
      textSettings.qrPosition.y,
      qrSize,
      qrSize
    );
  }

  // Upload to Cloudinary
  const buffer = canvas.toBuffer("image/png");
  const uploadResult = await uploadToCloudinary(
    buffer,
    `certificates/${user._id}`,
    `certificate-${certId}.png`,
    "image/png"
  );
  certUrl = uploadResult.secure_url;
  storageUrl = uploadResult.public_id;

  return {
    issued: true,
    issuedAt: awardedAt,
    certificateId: certId,
    certificateUrl: certUrl,   // Cloudinary URL
    storageUrl: storageUrl     // Cloudinary public_id
  };
}

module.exports = generateCertificateForUser;