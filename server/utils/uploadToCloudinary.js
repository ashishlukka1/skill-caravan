const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = async (fileBuffer, folder, filename, mimetype) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: mimetype.startsWith('video') ? 'video' : 'auto',
        public_id: filename,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    ).end(fileBuffer);
  });
};

module.exports = uploadToCloudinary;