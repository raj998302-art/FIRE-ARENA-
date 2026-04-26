const { db } = require('../models');
const { AppError } = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');

require('dotenv').config();

// Get current user profile
exports.getProfile = catchAsync(async (req, res, next) => {
  const user = req.user;
  
  // Get user roles
  const roles = await user.getRoles({
    attributes: ['id', 'name', 'description', 'level'],
    through: { attributes: [] }
  });
  
  // Get VIP status
  const vipSubscription = await db.VipSubscription.findOne({
    where: {
      userId: user.id,
      isActive: true
    },
    order: [['endDate', 'DESC']]
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        walletBalance: user.walletBalance,
        lockedBalance: user.lockedBalance,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isActive: user.isActive,
        isBanned: user.isBanned,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        level: role.level
      })),
      vipStatus: vipSubscription ? {
        plan: vipSubscription.plan,
        startDate: vipSubscription.startDate,
        endDate: vipSubscription.endDate,
        daysRemaining: vipSubscription.daysRemaining(),
        isActive: vipSubscription.isActive
      } : null
    }
  });
});

// Update user profile
exports.updateProfile = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { firstName, lastName, phoneNumber, dateOfBirth } = req.body;
  
  // Build update object
  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
  
  if (Object.keys(updateData).length === 0) {
    return next(new AppError('No fields to update', 400));
  }
  
  // Update user
  await req.user.update(updateData);
  
  // Get updated user
  const updatedUser = await db.User.findByPk(userId, {
    attributes: { exclude: ['passwordHash'] }
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
        dateOfBirth: updatedUser.dateOfBirth,
        walletBalance: updatedUser.walletBalance,
        lockedBalance: updatedUser.lockedBalance,
        isEmailVerified: updatedUser.isEmailVerified,
        isPhoneVerified: updatedUser.isPhoneVerified,
        isActive: updatedUser.isActive,
        isBanned: updatedUser.isBanned,
        lastLoginAt: updatedUser.lastLoginAt,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    }
  });
});

// Get user by ID (limited info for privacy)
exports.getUserById = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  
  // Users can view their own full profile
  // Others can only view limited info
  const isOwnProfile = userId === currentUserId;
  
  const user = await db.User.findByPk(userId, {
    attributes: isOwnProfile ? 
      { exclude: ['passwordHash'] } : 
      ['id', 'username', 'firstName', 'lastName', 'isActive']
  });
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Check if user is banned (can't view banned users unless it's your own profile)
  if (!isOwnProfile && user.isBanned) {
    return next(new AppError('User not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive
      }
    }
  });
});

// Search users
exports.searchUsers = catchAsync(async (req, res, next) => {
  const { query, limit = 10 } = req.query;
  const currentUserId = req.user.id;
  
  if (!query || query.length < 2) {
    return next(new AppError('Search query must be at least 2 characters', 400));
  }
  
  const limitNum = parseInt(limit);
  
  const users = await db.User.findAll({
    where: {
      [db.Sequelize.Or]: [
        { username: { [db.Sequelize.Op.like]: `%${query}%` } },
        { email: { [db.Sequelize.Op.like]: `%${query}%` } }
      ],
      id: { [db.Sequelize.Op.not]: currentUserId }, // Exclude current user
      isActive: true,
      isBanned: false
    },
    attributes: ['id', 'username', 'firstName', 'lastName'],
    limit: limitNum,
    order: [['username', 'ASC']]
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      }))
    }
  });
});

module.exports = exports;
