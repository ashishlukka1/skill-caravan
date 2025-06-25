const { createCanvas, loadImage } = require("canvas");
const QRCode = require("qrcode");
const UniversalCertificate = require("../models/UniversalCertificate");
const uploadToCloudinary = require("./uploadToCloudinary");
const { v4: uuidv4 } = require("uuid");

function percentToPixel(percent, total) {
  return (percent / 100) * total;
}

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

  // Helper to draw centered text in a box (font size relative to image height)
  // The frontend assumes a 600px canvas height for font sizes
  function drawCenteredText(text, box, fontFamily, color, baseFontSizePx, weight = "bold") {
    const x = percentToPixel(box.x + box.width / 2, image.width);
    const y = percentToPixel(box.y + box.height / 2, image.height);
    // Scale font size based on image height (frontend assumes 600px)
    const fontSize = Math.max((baseFontSizePx / 600) * image.height, 10);
    ctx.font = `${weight} ${fontSize}px "${fontFamily}"`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  const font = textSettings.font || {};

  // Draw user name
if (textSettings.nameBox) {
  drawCenteredText(
    user.name,
    textSettings.nameBox,
    font.family || "Arial",
    font.color || "#000000",
    font.nameSize || 32
  );
}

  // Draw course name
  if (textSettings.courseBox) {
    drawCenteredText(
      course.title,
      textSettings.courseBox,
      font.family || "Arial",
      font.color || "#000000",
      font.courseSize || 32
    );
  }

  // Draw awarded date
  if (textSettings.dateBox) {
    drawCenteredText(
      awardedAt.toLocaleDateString(),
      textSettings.dateBox,
      font.family || "Arial",
      font.color || "#000000",
      font.dateSize || 32
    );
  }

  // Draw QR code (centered in box)
  if (textSettings.qrBox) {
    const qrUrl = `${process.env.PUBLIC_URL || "https://localhost:5173"}/validate-certificate/${certId}`;
    const qrSize = percentToPixel(textSettings.qrBox.width, image.width);
    const qrBuffer = await QRCode.toBuffer(qrUrl, { width: qrSize, margin: 0 });
    const qrImage = await loadImage(qrBuffer);
    const qrX = percentToPixel(textSettings.qrBox.x + textSettings.qrBox.width / 2, image.width) - qrSize / 2;
    const qrY = percentToPixel(textSettings.qrBox.y + textSettings.qrBox.height / 2, image.height) - qrSize / 2;
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
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
    certificateUrl: certUrl,
    storageUrl: storageUrl,
  };
}

module.exports = generateCertificateForUser;