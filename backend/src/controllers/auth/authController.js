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
  
  // Validate input
  if (!username || !email || !password) {
    return next(new AppError('Please provide username, email, and password', 400));
  }
  
  if (username.length < 3) {
    return next(new AppError('Username must be at least 3 characters', 400));
  }
  
  if (password.length < 8) {
    return next(new AppError('Password must be at least 8 characters', 400));
  }
  
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
    firstName: firstName || '',
    lastName: lastName || '',
    phoneNumber: phoneNumber || '',
    isEmailVerified: false,
    isPhoneVerified: false
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
  
  // Store refresh token hash in database
  await db.RefreshToken.create({
    token: hashedRefreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  
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
    // Increment failed login attempts
    if (user) {
      await user.increment('failedLoginAttempts');
      
      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        await user.update({
          lockUntil: new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
        });
      }
      await user.save();
    }
    
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
  
  // Reset failed login attempts on successful login
  await user.update({
    failedLoginAttempts: 0,
    lockUntil: null,
    lastLoginAt: new Date()
  });
  
  // Generate tokens
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken();
  const hashedRefreshToken = hashToken(refreshToken);
  
  // Store refresh token hash in database
  await db.RefreshToken.create({
    token: hashedRefreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  
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
  const { refreshToken } = req.body;
  
  // Remove refresh token from database
  if (refreshToken) {
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await db.RefreshToken.destroy({
      where: { token: hashedToken }
    });
  }
  
  // Also clear cookies if present
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });
  
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
  
  // Hash the token to check against database
  const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
  // Find valid refresh token
  const tokenRecord = await db.RefreshToken.findOne({
    where: {
      token: hashedToken,
      expiresAt: { [db.Sequelize.Op.gt]: new Date() }
    },
    include: [{
      model: db.User,
      attributes: { exclude: ['passwordHash'] }
    }]
  });
  
  if (!tokenRecord) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }
  
  const user = tokenRecord.User;
  
  // Remove old refresh token
  await db.RefreshToken.destroy({
    where: { id: tokenRecord.id }
  });
  
  // Generate new tokens
  const newToken = generateToken(user.id);
  const newRefreshToken = generateRefreshToken();
  const newHashedRefreshToken = hashToken(newRefreshToken);
  
  // Store new refresh token
  await db.RefreshToken.create({
    token: newHashedRefreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  
  // Remove password from output
  const userResponse = user.toJSON();
  delete userResponse.passwordHash;
  
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
  
  // Don't reveal whether email exists for security
  if (!user) {
    return res.status(200).json({
      status: 'success',
      message: 'If the email exists in our system, you will receive a password reset link'
    });
  }
  
  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Store hashed token and expiry (1 hour)
  await user.update({
    passwordResetToken: hashedResetToken,
    passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  });
  
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
  
  // Validate password length
  if (password.length < 8) {
    return next(new AppError('Password must be at least 8 characters', 400));
  }
  
  // Hash the token to compare with stored value
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  // Find user by reset token
  const user = await db.User.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { [db.Sequelize.Op.gt]: new Date() }
    }
  });
  
  if (!user) {
    return next(new AppError('Invalid or expired token', 400));
  }
  
  // Update password
  user.passwordHash = password; // Will be hashed by hook
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  
  await user.save();
  
  // Invalidate all existing refresh tokens for security
  await db.RefreshToken.destroy({
    where: { userId: user.id }
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Password has been reset successfully'
  });
});

module.exports = exports;
