import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as svc from './rewards.service';

const router = Router();

// --- Daily spin + streak ---
router.get('/spin/status', requireAuth, async (req, res, next) => {
  try { res.json(await svc.spinStatus(req.user!.id)); } catch (e) { next(e); }
});

router.post('/spin', requireAuth, async (req, res, next) => {
  try { res.json(await svc.doSpin(req.user!.id)); } catch (e) { next(e); }
});

// --- Promo codes ---
router.post(
  '/promo/redeem',
  requireAuth,
  validate(z.object({ code: z.string().min(3).max(40) })),
  async (req, res, next) => {
    try { res.json(await svc.redeemPromo(req.user!.id, req.body.code)); } catch (e) { next(e); }
  }
);

// Admin
router.get('/admin/promos', requireAuth, requireAdmin, async (_req, res, next) => {
  try { res.json(await svc.listPromos()); } catch (e) { next(e); }
});

router.post(
  '/admin/promos',
  requireAuth, requireAdmin,
  validate(z.object({
    code: z.string().min(3).max(40),
    rewardCoins: z.number().int().positive().max(100000),
    maxUses: z.number().int().positive().max(1_000_000).optional(),
    perUserLimit: z.number().int().positive().max(100).optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  })),
  async (req, res, next) => {
    try { res.json(await svc.createPromo(req.user!.id, req.body)); } catch (e) { next(e); }
  }
);

router.post(
  '/admin/promos/:code/deactivate',
  requireAuth, requireAdmin,
  async (req, res, next) => {
    try { res.json(await svc.deactivatePromo(req.params.code)); } catch (e) { next(e); }
  }
);

export default router;
