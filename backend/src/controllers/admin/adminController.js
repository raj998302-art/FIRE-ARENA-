const { db } = require('../models');
const { AppError } = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');

require('dotenv').config();

// Get dashboard stats
exports.getDashboardStats = catchAsync(async (req, res, next) => {
  // Requires admin or higher role
  
  try {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      totalTournaments,
      activeTournaments,
      completedTournaments,
      totalPayments,
      successfulPayments,
      totalVolume
    ] = await Promise.all([
      db.User.count(),
      db.User.count({ where: { isActive: true, isBanned: false } }),
      db.User.count({ where: { isBanned: true } }),
      db.Tournament.count(),
      db.Tournament.count({ where: { status: { [db.Sequelize.Op.not]: 'completed' } } }),
      db.Tournament.count({ where: { status: 'completed' } }),
      db.Payment.count(),
      db.Payment.count({ where: { status: 'success' } }),
      db.Payment.sum('amount', { where: { status: 'success' } }) || 0
    ]);
    
    res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers
        },
        tournaments: {
          total: totalTournaments,
          active: activeTournaments,
          completed: completedTournaments
        },
        payments: {
          total: totalPayments,
          successful: successfulPayments,
          volume: parseFloat(totalVolume)
        }
      }
    });
  } catch (error) {
    return next(new AppError('Failed to fetch dashboard stats', 500));
  }
});

// Get all users (paginated)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, search, isActive, isBanned } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  
  // Build where clause
  const whereClause = {};
  if (search) {
    whereClause[db.Sequelize.Or] = [
      { username: { [db.Sequelize.Op.like]: `%${search}%` } },
      { email: { [db.Sequelize.Op.like]: `%${search}%` } }
    ];
  }
  if (isActive !== undefined) whereClause.isActive = isActive === 'true';
  if (isBanned !== undefined) whereClause.isBanned = isBanned === 'true';
  
  try {
    const { count, rows } = await db.User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['passwordHash'] },
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: offset
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        users: rows.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          isActive: user.isActive,
          isBanned: user.isBanned,
          walletBalance: user.walletBalance,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        })),
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(count / limitNum)
        }
      }
    });
  } catch (error) {
    return next(new AppError('Failed to fetch users', 500));
  }
});

// Ban/unban user
exports.toggleBanStatus = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { banReason, bannedUntil } = req.body;
  const adminUserId = req.user.id;
  
  // Get target user
  const user = await db.User.findByPk(userId);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Prevent self-banning
  if (user.id === adminUserId) {
    return next(new AppError('Cannot ban yourself', 400));
  }
  
  try {
    // Toggle ban status
    const newBanStatus = !user.isBanned;
    
    await user.update(
      {
        isBanned: newBanStatus,
        banReason: newBanStatus ? banReason : null,
        bannedUntil: newBanStatus ? (bannedUntil ? new Date(bannedUntil) : null) : null,
        updatedBy: adminUserId
      }
    );
    
    // Create audit log
    await db.AuditLog.create({
      userId: adminUserId,
      action: newBanStatus ? 'user_banned' : 'user_unbanned',
      entityType: 'User',
      entityId: user.id,
      changes: {
        isBanned: [user.isBanned, newBanStatus],
        banReason: [user.banReason, newBanStatus ? banReason : null],
        bannedUntil: [user.bannedUntil, newBanStatus ? bannedUntil : null]
      }
    });
    
    res.status(200).json({
      status: 'success',
      message: `User has been ${newBanStatus ? 'banned' : 'unbanned'} successfully`,
      data: {
        user: {
          id: user.id,
          username: user.username,
          isBanned: user.isBanned,
          banReason: user.banReason,
          bannedUntil: user.bannedUntil
        }
      }
    });
  } catch (error) {
    return next(new AppError('Failed to update ban status', 500));
  }
});

// Get system settings
exports.getSystemSettings = catchAsync(async (req, res, next) => {
  // In practice, you'd fetch from a settings table or config
  res.status(200).json({
    status: 'success',
    data: {
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      registrationEnabled: true,
      tournamentCreationEnabled: true,
      paymentProcessingEnabled: true,
      chatEnabled: true,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Update system settings
exports.updateSystemSettings = catchAsync(async (req, res, next) => {
  const { maintenanceMode, registrationEnabled, tournamentCreationEnabled, 
          paymentProcessingEnabled, chatEnabled } = req.body;
  const adminUserId = req.user.id;
  
  // In practice, you'd update a settings table or config file
  // For now, we'll just return success
  
  // Create audit log
  await db.AuditLog.create({
    userId: adminUserId,
    action: 'system_settings_updated',
    entityType: 'System',
    entityId: 'settings',
    changes: {
      maintenanceMode: [process.env.MAINTENANCE_MODE, maintenanceMode],
      registrationEnabled: [true, registrationEnabled],
      tournamentCreationEnabled: [true, tournamentCreationEnabled],
      paymentProcessingEnabled: [true, paymentProcessingEnabled],
      chatEnabled: [true, chatEnabled]
    }
  });
  
  res.status(200).json({
    status: 'success',
    message: 'System settings updated successfully',
    data: {
      maintenanceMode: !!maintenanceMode,
      registrationEnabled: !!registrationEnabled,
      tournamentCreationEnabled: !!tournamentCreationEnabled,
      paymentProcessingEnabled: !!paymentProcessingEnabled,
      chatEnabled: !!chatEnabled
    }
  });
});

// Get audit logs
exports.getAuditLogs = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 50, userId, action, entityType, startDate, endDate } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  
  // Build where clause
  const whereClause = {};
  if (userId) whereClause.userId = userId;
  if (action) whereClause.action = action;
  if (entityType) whereClause.entityType = entityType;
  if (startDate) whereClause.createdAt = { [db.Sequelize.Op.gte]: new Date(startDate) };
  if (endDate) {
    if (startDate) {
      whereClause.createdAt = {
        [db.Sequelize.Op.and]: [
          { [db.Sequelize.Op.gte]: new Date(startDate) },
          { [db.Sequelize.Op.lte]: new Date(endDate) }
        ]
      };
    } else {
      whereClause.createdAt = { [db.Sequelize.Op.lte]: new Date(endDate) };
    }
  }
  
  try {
    const { count, rows } = await db.AuditLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: offset
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        logs: rows.map(log => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          changes: log.changes,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          sessionId: log.sessionId,
          severity: log.severity,
          success: log.success,
          errorMessage: log.errorMessage,
          createdAt: log.createdAt,
          user: log.User ? {
            id: log.User.id,
            username: log.User.username,
            firstName: log.User.firstName,
            lastName: log.User.lastName
          } : null
        })),
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(count / limitNum)
        }
      }
    });
  } catch (error) {
    return next(new AppError('Failed to fetch audit logs', 500));
  }
});

module.exports = exports;
