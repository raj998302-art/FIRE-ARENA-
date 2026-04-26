const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { z } = require('zod');

// All routes require authentication
router.use(protect);

// Get dashboard stats (requires admin or higher)
router.get(
  '/dashboard/stats',
  authorize(
    'HEAD_ADMIN',
    'SENIOR_ADMIN',
    'ADMIN',
    'HEAD_PAYMENT_MANAGER',
    'SENIOR_PAYMENT_MANAGER',
    'PAYMENT_MANAGER',
    'HEAD_TOURNAMENT_MANAGER',
    'SENIOR_TOURNAMENT_MANAGER',
    'TOURNAMENT_MANAGER',
    'HEAD_TECHNICAL_MANAGER',
    'TECHNICAL_MANAGER',
    'HEAD_VIP_MANAGER',
    'VIP_MANAGER',
    'HEAD_ADMIN',
    'OWNER',
    'CO_OWNER',
    'FAM_MANAGER'
  ),
  adminController.getDashboardStats
);

// Get all users (requires admin or higher)
router.get(
  '/users',
  authorize(
    'HEAD_ADMIN',
    'SENIOR_ADMIN',
    'ADMIN',
    'OWNER',
    'CO_OWNER',
    'FAM_MANAGER'
  ),
  adminController.getAllUsers
);

// Ban/unban user (requires admin or higher)
router.post(
  '/users/:userId/ban',
  authorize(
    'HEAD_ADMIN',
    'SENIOR_ADMIN',
    'ADMIN',
    'OWNER',
    'CO_OWNER',
    'FAM_MANAGER'
  ),
  validate(
    z.object({
      userId: z.string(),
      banReason: z.string().optional(),
      bannedUntil: z.string().datetime().optional()
    })
  ),
  adminController.toggleBanStatus
);

// Get system settings (requires admin or higher)
router.get(
  '/settings',
  authorize(
    'HEAD_ADMIN',
    'SENIOR_ADMIN',
    'ADMIN',
    'OWNER',
    'CO_OWNER',
    'FAM_MANAGER'
  ),
  adminController.getSystemSettings
);

// Update system settings (requires owner or co-owner)
router.post(
  '/settings',
  authorize(
    'OWNER',
    'CO_OWNER'
  ),
  validate(
    z.object({
      maintenanceMode: z.boolean().optional(),
      registrationEnabled: z.boolean().optional(),
      tournamentCreationEnabled: z.boolean().optional(),
      paymentProcessingEnabled: z.boolean().optional(),
      chatEnabled: z.boolean().optional()
    })
  ),
  adminController.updateSystemSettings
);

// Get audit logs (requires admin or higher)
router.get(
  '/audit-logs',
  authorize(
    'HEAD_ADMIN',
    'SENIOR_ADMIN',
    'ADMIN',
    'OWNER',
    'CO_OWNER',
    'FAM_MANAGER'
  ),
  adminController.getAuditLogs
);

module.exports = router;
