const { createCanvas, loadImage, registerFont } = require("canvas");
const cloudinary = require("cloudinary").v2;

// Configure cloudinary (ensure these env vars are set)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generates a personalized certificate, uploads to Cloudinary, and returns the URL.
 * @param {string} templateUrl - The certificate template image URL.
 * @param {object} textSettings - { namePosition: {x, y}, font: {family, size, color} }
 * @param {string} userName - The name to print on the certificate.
 * @param {string} uploadFolder - Cloudinary folder to upload to.
 * @returns {Promise<{url: string, public_id: string}>}
 */
async function generateAndUploadCertificate(templateUrl, textSettings, userName, uploadFolder) {
  // Load template image
  const templateImage = await loadImage(templateUrl);

  // Prepare canvas
  const canvas = createCanvas(templateImage.width, templateImage.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(templateImage, 0, 0);

  // Draw user's name
  const { namePosition, font } = textSettings;
  if (font?.family) {
    // Optionally register a custom font if needed
    // registerFont('path/to/font.ttf', { family: font.family });
    ctx.font = `${font.size || 32}px ${font.family}`;
  } else {
    ctx.font = "32px Arial";
  }
  ctx.fillStyle = font?.color || "#000";
  ctx.textAlign = "center";
  ctx.fillText(userName, namePosition.x, namePosition.y);

  // Convert canvas to buffer
  const buffer = canvas.toBuffer("image/png");

  // Upload to Cloudinary
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: uploadFolder,
        resource_type: "image",
        format: "png",
        public_id: `cert_${Date.now()}`
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

module.exports = generateAndUploadCertificate;