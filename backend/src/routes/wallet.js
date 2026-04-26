const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet/walletController');
const { protect } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { z } = require('zod');

// All routes require authentication
router.use(protect);

// Get wallet balance
router.get(
  '/balance',
  walletController.getBalance
);

// Add funds (internal use - would typically be called by payment service)
router.post(
  '/add-funds',
  validate(
    z.object({
      amount: z.number().positive(),
      category: z.enum([
        'deposit', 'referral_bonus', 'bonus', 'adjustment', 'refund'
      ]),
      description: z.string().optional(),
      referenceId: z.string().optional(),
      referenceType: z.string().optional()
    })
  ),
  walletController.addFunds
);

// Deduct funds (internal use)
router.post(
  '/deduct-funds',
  validate(
    z.object({
      amount: z.number().positive(),
      category: z.enum([
        'withdrawal', 'tournament_entry', 'adjustment'
      ]),
      description: z.string().optional(),
      referenceId: z.string().optional(),
      referenceType: z.string().optional()
    })
  ),
  walletController.deductFunds
);

// Lock funds (for tournament entry, etc.)
router.post(
  '/lock-funds',
  validate(
    z.object({
      amount: z.number().positive(),
      category: z.enum([
        'tournament_entry', 'vip_subscription', 'locked_prize'
      ]),
      description: z.string().optional(),
      referenceId: z.string().optional(),
      referenceType: z.string().optional()
    })
  ),
  walletController.lockFunds
);

// Unlock funds
router.post(
  '/unlock-funds',
  validate(
    z.object({
      amount: z.number().positive(),
      category: z.enum([
        'tournament_entry', 'vip_subscription', 'tournament_prize', 'refund'
      ]),
      description: z.string().optional(),
      referenceId: z.string().optional(),
      referenceType: z.string().optional()
    })
  ),
  walletController.unlockFunds
);

// Get transaction history
router.get(
  '/transactions',
  walletController.getTransactionHistory
);

module.exports = router;
