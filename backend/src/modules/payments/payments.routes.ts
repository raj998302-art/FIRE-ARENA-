import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePaymentMgr } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { paymentLimiter } from '../../middleware/rateLimit';
import * as svc from './payments.service';

const router = Router();

router.get('/methods', requireAuth, (_req, res) => {
  res.json({
    razorpayEnabled: !!process.env.RAZORPAY_KEY_ID,
    manualUpi: svc.manualUpiInfo(),
  });
});

router.post(
  '/razorpay/order',
  requireAuth, paymentLimiter,
  validate(z.object({ amountCoins: z.number().int().min(10).max(100000) })),
  async (req, res, next) => {
    try { res.json(await svc.createRazorpayOrder(req.user!.id, req.body.amountCoins)); } catch (e) { next(e); }
  }
);

router.post(
  '/razorpay/vip-order',
  requireAuth, paymentLimiter,
  validate(z.object({ planCode: z.string().min(2).max(32) })),
  async (req, res, next) => {
    try { res.json(await svc.createRazorpayVipOrder(req.user!.id, req.body.planCode)); } catch (e) { next(e); }
  }
);

router.post(
  '/razorpay/verify',
  requireAuth, paymentLimiter,
  validate(z.object({ orderId: z.string(), paymentId: z.string(), signature: z.string() })),
  async (req, res, next) => {
    try { res.json(await svc.verifyRazorpayPayment(req.user!.id, req.body)); } catch (e) { next(e); }
  }
);

router.post(
  '/upi/submit',
  requireAuth, paymentLimiter,
  validate(z.object({
    amountCoins: z.number().int().min(10).max(100000),
    utr: z.string().min(8).max(22),
    upiId: z.string().optional(),
    screenshotUrl: z.string().url().optional(),
  })),
  async (req, res, next) => {
    try { res.json(await svc.submitManualUpiUtr(req.user!.id, req.body)); } catch (e) { next(e); }
  }
);

router.get('/me', requireAuth, async (req, res, next) => {
  try { res.json(await svc.listMyPayments(req.user!.id)); } catch (e) { next(e); }
});

// Admin / payment-manager only
router.get('/admin/pending', requireAuth, requirePaymentMgr, async (_req, res, next) => {
  try { res.json(await svc.listPendingManualPayments()); } catch (e) { next(e); }
});

router.post('/admin/:id/approve', requireAuth, requirePaymentMgr, async (req, res, next) => {
  try { res.json(await svc.approveManualPayment(req.params.id, req.user!.id)); } catch (e) { next(e); }
});

router.post(
  '/admin/:id/reject',
  requireAuth, requirePaymentMgr,
  validate(z.object({ reason: z.string().min(1).max(500) })),
  async (req, res, next) => {
    try { res.json(await svc.rejectManualPayment(req.params.id, req.user!.id, req.body.reason)); } catch (e) { next(e); }
  }
);

export default router;
