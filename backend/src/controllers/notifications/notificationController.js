const { db } = require('../models');
const { AppError } = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');

require('dotenv').config();

// Get user notifications
exports.getNotifications = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, isRead, type, limitUnread } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  
  // Build where clause
  const whereClause = { userId };
  if (isRead !== undefined) whereClause.isRead = isRead === 'true';
  if (type) whereClause.type = type;
  
  // If requesting only unread count, optimize query
  if (limitUnread && limitUnread === 'true') {
    try {
      const count = await db.Notification.count({
        where: {
          ...whereClause,
          isRead: false
        }
      });
      
      return res.status(200).json({
        status: 'success',
        data: {
          unreadCount: count
        }
      });
    } catch (error) {
      return next(new AppError('Failed to get unread count', 500));
    }
  }
  
  try {
    const { count, rows } = await db.Notification.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: offset
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        notifications: rows.map(notification => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          isRead: notification.isRead,
          readAt: notification.readAt,
          isArchived: notification.isArchived,
          archivedAt: notification.archivedAt,
          actionUrl: notification.actionUrl,
          actionText: notification.actionText,
          createdAt: notification.createdAt
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
    return next(new AppError('Failed to fetch notifications', 500));
  }
});

// Mark notification as read
exports.markAsRead = catchAsync(async (req, res, next) => {
  const { notificationId } = req.params;
  const userId = req.user.id;
  
  try {
    const notification = await db.Notification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });
    
    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }
    
    await notification.update({
      isRead: true,
      readAt: new Date()
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read successfully'
    });
  } catch (error) {
    return next(new AppError('Failed to mark notification as read', 500));
  }
});

// Mark all notifications as read
exports.markAllAsRead = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  try {
    await db.Notification.update(
      { 
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          userId,
          isRead: false
        }
      }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read successfully'
    });
  } catch (error) {
    return next(new AppError('Failed to mark all notifications as read', 500));
  }
});

// Archive notification
exports.archiveNotification = catchAsync(async (req, res, next) => {
  const { notificationId } = req.params;
  const userId = req.user.id;
  
  try {
    const notification = await db.Notification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });
    
    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }
    
    await notification.update({
      isArchived: true,
      archivedAt: new Date()
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Notification archived successfully'
    });
  } catch (error) {
    return next(new AppError('Failed to archive notification', 500));
  }
});

// Delete notification
exports.deleteNotification = catchAsync(async (req, res, next) => {
  const { notificationId } = req.params;
  const userId = req.user.id;
  
  try {
    const notification = await db.Notification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });
    
    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }
    
    await notification.destroy();
    
    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    return next(new AppError('Failed to delete notification', 500));
  }
});

// Get notification settings (placeholder)
exports.getNotificationSettings = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  // In practice, you'd fetch from user notification preferences
  res.status(200).json({
    status: 'success',
    data: {
      settings: {
        paymentSuccess: true,
        paymentFailed: true,
        tournamentJoined: true,
        tournamentStarted: true,
        tournamentEnded: true,
        tournamentWon: true,
        vipExpiring: true,
        vipExpired: true,
        referralBonus: true,
        systemAnnouncements: true,
        maintenanceMode: true
      }
    }
  });
});

// Update notification settings (placeholder)
exports.updateNotificationSettings = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const settings = req.body;
  
  // In practice, you'd save to user notification preferences
  res.status(200).json({
    status: 'success',
    message: 'Notification settings updated successfully',
    data: {
      settings
    }
  });
});

module.exports = exports;
