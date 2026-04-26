const { AppError } = require('../../utils/appError');
const { catchAsync } = require('../../utils/catchAsync');
const { uploadToCloudinary } = require('../../utils/upload');
const { db } = require('../models');
require('dotenv').config();

// Upload file (image, video, document)
exports.uploadFile = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }

  try {
    // Upload to Cloudinary or local storage
    const result = await uploadToCloudinary(req.file.path, {
      folder: 'fire_arena_max/chat',
      resource_type: 'auto' // automatically detects image/video/raw
    });

    res.status(201).json({
      status: 'success',
      message: 'File uploaded successfully',
      data: {
        fileUrl: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes
      }
    });
  } catch (error) {
    return next(new AppError('File upload failed', 500));
  }
});

// Delete uploaded file
exports.deleteFile = catchAsync(async (req, res, next) => {
  const { publicId } = req.params;
  const { resourceType = 'image' } = req.query;

  if (!publicId) {
    return next(new AppError('Public ID is required', 400));
  }

  try {
    const result = await deleteFromCloudinary(publicId, resourceType);

    res.status(200).json({
      status: 'success',
      message: 'File deleted successfully',
      data: result
    });
  } catch (error) {
    return next(new AppError('File deletion failed', 500));
  }
});

module.exports = exports;