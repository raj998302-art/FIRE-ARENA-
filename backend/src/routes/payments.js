const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payments/paymentController');
const { protect } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { z } = require('zod');

// All routes require authentication
router.use(protect);

// Create Razorpay order
router.post(
  '/order',
  validate(
    z.object({
      amount: z.number().positive(),
      currency: z.enum(['INR', 'USD']).optional(),
      receipt: z.string().optional(),
      notes: z.object({}).optional()
    })
  ),
  paymentController.createOrder
);

// Verify and process payment
router.post(
  '/verify',
  validate(
    z.object({
      razorpayPaymentId: z.string(),
      razorpayOrderId: z.string(),
      razorpaySignature: z.string()
    })
  ),
  paymentController.verifyPayment
);

// Webhook endpoint for Razorpay (no authentication - verified by signature)
router.post(
  '/webhook',
  paymentController.webhook
);

// Get payment status
router.get(
  '/:paymentId',
  validate(
    z.object({
      paymentId: z.string()
    })
  ),
  paymentController.getPaymentStatus
);

// Get user payment history
router.get(
  '/history',
  paymentController.getUserPaymentHistory
);

module.exports = router;
