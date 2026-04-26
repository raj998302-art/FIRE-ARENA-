const express = require('express');
const router = express.Router();
const vipController = require('../controllers/vip/vipController');
const { protect } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { z } = require('zod');

// All routes require authentication
router.use(protect);

// Get VIP status
router.get(
  '/status',
  vipController.getVipStatus
);

// Purchase VIP subscription
router.post(
  '/purchase',
  validate(
    z.object({
      plan: z.enum(['weekly', 'monthly']),
      amount: z.number().positive()
    })
  ),
  vipController.purchaseVip
);

// Cancel VIP subscription
router.post(
  '/cancel',
  vipController.cancelVip
);

// Get VIP-only tournaments
router.get(
  '/tournaments',
  validate(
    z.object({
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().max(50).optional()
    })
  ),
  vipController.getVipTournaments
);

module.exports = router;
