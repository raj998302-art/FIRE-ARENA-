const cloudinary = require('cloudinary').v2;
const { AppError } = require('./appError');
require('dotenv').configure();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload file to Cloudinary
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || 'fire_arena_max',
      width: options.width,
      height: options.height,
      crop: options.crop || 'limit',
      ...options
    });
    return result;
  } catch (error) {
    throw new AppError('Failed to upload file to Cloudinary', 500);
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    throw new AppError('Failed to delete file from Cloudinary', 500);
  }
};

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  const matches = url.match(/\/v\d+\/(.+)\.(.+)$/);
  return matches ? matches[1] : null;
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl
};