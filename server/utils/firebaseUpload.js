const { bucket } = require('../config/firebase');
const path = require('path');

const uploadToFirebase = async (file, folder) => {
  try {
    const timestamp = Date.now();
    const fileName = `${folder}/${timestamp}-${file.originalname.replace(/\s+/g, '-')}`;
    const fileUpload = bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => reject(error));

      blobStream.on('finish', async () => {
        await fileUpload.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        
        resolve({
          url: publicUrl,
          path: fileName,
          originalName: file.originalname,
          contentType: file.mimetype,
          size: file.size
        });
      });

      blobStream.end(file.buffer);
    });
  } catch (error) {
    throw error;
  }
};

module.exports = { uploadToFirebase };