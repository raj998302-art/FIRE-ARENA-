const { db } = require('../models');
const { AppError } = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

require('dotenv').config();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
};

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash refresh token
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Register new user
exports.register = catchAsync(async (req, res, next) => {
  const { username, email, password, firstName, lastName, phoneNumber } = req.body;
  
  // Check if user already exists
  const existingUser = await db.User.findOne({
    where: {
      [db.Sequelize.Or]: [
        { email: email },
        { username: username }
      ]
    }
  });
  
  if (existingUser) {
    return next(new AppError('User with this email or username already exists', 400));
  }
  
  // Create new user
  const user = await db.User.create({
    username,
    email,
    passwordHash: password, // Will be hashed by hook
    firstName,
    lastName,
    phoneNumber
  });
  
  // Assign default role (REGULAR_USER)
  const defaultRole = await db.Role.findOne({
    where: { name: 'REGULAR_USER', isActive: true }
  });
  
  if (defaultRole) {
    await user.addRole(defaultRole);
  }
  
  // Generate tokens
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken();
  const hashedRefreshToken = hashToken(refreshToken);
  
  // Store refresh token hash in user record (in practice, you'd have a separate table)
  // For simplicity, we're adding it to the user model temporarily
  
  // Remove password from output
  const userResponse = user.toJSON();
  delete userResponse.passwordHash;
  
  res.status(201).json({
    status: 'success',
    data: {
      user: userResponse,
      token,
      refreshToken
    }
  });
});

// Login user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  
  // Check if user exists
  const user = await db.User.findOne({ where: { email } });
  
  if (!user || !(await user.validPassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  
  // Check if account is locked
  if (user.lockUntil && user.lockUntil > new Date()) {
    return next(new AppError('Account is temporarily locked due to too many failed attempts', 401));
  }
  
  // Check if account is active
  if (!user.isActive) {
    return next(new AppError('Account is deactivated', 401));
  }
  
  // Check if account is banned
  if (user.isBanned) {
    return next(new AppError('Account is banned', 401));
  }
  
  // Reset failed login attempts
  await user.update({
    failedLoginAttempts: 0,
    lockUntil: null,
    lastLoginAt: new Date()
  });
  
  // Generate tokens
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken();
  const hashedRefreshToken = hashToken(refreshToken);
  
  // Store refresh token hash (in practice, use separate table)
  
  // Remove password from output
  const userResponse = user.toJSON();
  delete userResponse.passwordHash;
  
  res.status(200).json({
    status: 'success',
    data: {
      user: userResponse,
      token,
      refreshToken
    }
  });
});

// Logout user
exports.logout = catchAsync(async (req, res, next) => {
  // In a real implementation, you would invalidate the token
  // For now, we'll just return success
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

// Refresh token
exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return next(new AppError('Please provide refresh token', 400));
  }
  
  // In a real implementation, you would:
  // 1. Hash the refresh token
  // 2. Look it up in your refresh token table
  // 3. Verify it belongs to a user
  // 4. Generate new access and refresh tokens
  // 5. Invalidate the old refresh token
  
  // For now, we'll simulate this process
  const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
  // This is a simplified version - in practice, you'd check against stored hashes
  // For demo purposes, we'll generate new tokens (not secure for production)
  
  // Find user by some identifier (in practice, from refresh token table)
  // This is a placeholder implementation
  const user = req.user; // Assuming middleware has set this
  
  if (!user) {
    return next(new AppError('Invalid refresh token', 401));
  }
  
  const newToken = generateToken(user.id);
  const newRefreshToken = generateRefreshToken();
  
  res.status(200).json({
    status: 'success',
    data: {
      token: newToken,
      refreshToken: newRefreshToken
    }
  });
});

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  
  // Check if user exists
  const user = await db.User.findOne({ where: { email } });
  
  if (!user) {
    // Don't reveal whether email exists for security
    return res.status(200).json({
      status: 'success',
      message: 'If the email exists in our system, you will receive a password reset link'
    });
  }
  
  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Store hashed token and expiry (in practice, add fields to user or create separate table)
  // For now, we'll just simulate
  
  // In a real implementation, you would send email here
  console.log(`Password reset token for ${email}: ${resetToken}`);
  
  res.status(200).json({
    status: 'success',
    message: 'If the email exists in our system, you will receive a password reset link'
  });
});

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token, password } = req.body;
  
  if (!token || !password) {
    return next(new AppError('Please provide token and new password', 400));
  }
  
  // Hash the token to compare with stored value
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  // Find user by reset token (in practice, query your reset token table)
  // This is a simplified version
  
  // For demo, we'll just update the first user (NOT SECURE - for demonstration only)
  // IN PRODUCTION: You would look up the user by the hashed token
  
  const user = await db.User.findOne({ where: { id: 1 } }); // PLACEHOLDER
  
  if (!user) {
    return next(new AppError('Invalid or expired token', 400));
  }
  
  // Update password
  user.passwordHash = password; // Will be hashed by hook
  user.passwordResetExpires = undefined; // Clear expiry
  user.passwordResetToken = undefined; // Clear token
  
  await user.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Password has been reset successfully'
  });
});

module.exports = exports;
