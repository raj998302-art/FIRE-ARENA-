const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notifications/notificationController');
const { protect } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { z } = require('zod');

// All routes require authentication
router.use(protect);

// Get user notifications
router.get(
  '/',
  validate(
    z.object({
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().max(100).optional(),
      isRead: z.boolean().optional(),
      type: z.string().optional(),
      limitUnread: z.string().optional()
    })
  ),
  notificationController.getNotifications
);

// Mark notification as read
router.patch(
  '/:notificationId/read',
  validate(
    z.object({
      notificationId: z.string()
    })
  ),
  notificationController.markAsRead
);

// Mark all notifications as read
router.post(
  '/mark-all-read',
  notificationController.markAllAsRead
);

// Archive notification
router.patch(
  '/:notificationId/archive',
  validate(
    z.object({
      notificationId: z.string()
    })
  ),
  notificationController.archiveNotification
);

// Delete notification
router.delete(
  '/:notificationId',
  validate(
    z.object({
      notificationId: z.string()
    })
  ),
  notificationController.deleteNotification
);

// Get notification settings
router.get(
  '/settings',
  notificationController.getNotificationSettings
);

// Update notification settings
router.post(
  '/settings',
  notificationController.updateNotificationSettings
);

module.exports = router;
