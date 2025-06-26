const { createCanvas, loadImage } = require("canvas");
const cloudinary = require("cloudinary").v2;

async function generateAndUploadCertificate(
  templateUrl,
  textSettings,
  userName,
  uploadFolder
) {
  const templateImage = await loadImage(templateUrl);

  const canvas = createCanvas(templateImage.width, templateImage.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(templateImage, 0, 0);

  // Use DB settings exactly as in AddCertificate preview
  const { namePosition, font } = textSettings;
  const fontSize = font?.size || 32;
  const fontFamily = font?.family || "Arial";
  const fontColor = font?.color || "#000000";
  const fontWeight = "bold"; // Your preview uses bold

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = fontColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Draw the user's name at the exact position from DB
  ctx.fillText(userName, namePosition.x, namePosition.y);

  const buffer = canvas.toBuffer("image/png");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: uploadFolder,
        resource_type: "image",
        format: "png",
        public_id: `cert_${Date.now()}`,
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
