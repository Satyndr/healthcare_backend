const ErrorResponse = require("../utils/ErrorResponse");
const User = require("../models/User");
const File = require("../models/File");
const { cloudinary } = require("../config/cloudinary");

// @desc    Upload file for user
// @route   POST /api/v1/upload
// @access  Private
exports.uploadFile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.user.id}`, 404)
      );
    }

    if (!req.file) {
      return next(new ErrorResponse(`Please upload a file`, 400));
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto", // Automatically detect file type
    });

    // Create file in database
    const file = await File.create({
      user: req.user.id,
      public_id: result.public_id,
      url: result.secure_url,
      filename: req.file.originalname,
    });

    // Add file to user's files array
    user.files.push({
      public_id: result.public_id,
      url: result.secure_url,
      filename: req.file.originalname,
    });

    await user.save();

    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all files for logged in user
// @route   GET /api/v1/files
// @access  Private
exports.getUserFiles = async (req, res, next) => {
  try {
    // Option 1: Get files from User model
    // const user = await User.findById(req.user.id).select('files');
    // return res.status(200).json({
    //   success: true,
    //   count: user.files.length,
    //   data: user.files,
    // });

    // Option 2: Get files from File model (better for pagination, filtering, etc.)
    const files = await File.find({ user: req.user.id }).sort("-uploadedAt");

    res.status(200).json({
      success: true,
      count: files.length,
      data: files,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a file
// @route   DELETE /api/v1/files/:id
// @access  Private
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!file) {
      return next(
        new ErrorResponse(`No file found with id ${req.params.id}`, 404)
      );
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(file.public_id);

    // Delete from database
    await file.remove();

    // Remove from user's files array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { files: { public_id: file.public_id } },
    });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
