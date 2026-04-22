import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePaymentMgr } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as svc from './withdrawals.service';

const router = Router();

router.post(
  '/request',
  requireAuth,
  validate(z.object({
    amountCoins: z.number().int().min(100).max(100000),
    upiId: z.string().min(3).max(64),
    accountName: z.string().max(64).optional(),
  })),
  async (req, res, next) => {
    try { res.json(await svc.requestWithdrawal(req.user!.id, req.body)); } catch (e) { next(e); }
  }
);

router.get('/me', requireAuth, async (req, res, next) => {
  try { res.json(await svc.listMyWithdrawals(req.user!.id)); } catch (e) { next(e); }
});

router.get('/admin/pending', requireAuth, requirePaymentMgr, async (_req, res, next) => {
  try { res.json(await svc.listPendingWithdrawals()); } catch (e) { next(e); }
});

router.post(
  '/admin/:id/approve',
  requireAuth, requirePaymentMgr,
  validate(z.object({ payoutRef: z.string().optional() })),
  async (req, res, next) => {
    try { res.json(await svc.approveWithdrawal(req.params.id, req.user!.id, req.body.payoutRef)); } catch (e) { next(e); }
  }
);

router.post(
  '/admin/:id/reject',
  requireAuth, requirePaymentMgr,
  validate(z.object({ reason: z.string().min(1).max(500) })),
  async (req, res, next) => {
    try { res.json(await svc.rejectWithdrawal(req.params.id, req.user!.id, req.body.reason)); } catch (e) { next(e); }
  }
);

router.post(
  '/admin/:id/paid',
  requireAuth, requirePaymentMgr,
  validate(z.object({ payoutRef: z.string().min(1) })),
  async (req, res, next) => {
    try { res.json(await svc.markPaid(req.params.id, req.user!.id, req.body.payoutRef)); } catch (e) { next(e); }
  }
);

export default router;
