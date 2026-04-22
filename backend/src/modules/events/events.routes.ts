import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as svc from './events.service';

const router = Router();

router.get('/active', async (_req, res, next) => {
  try { res.json(await svc.listActive()); } catch (e) { next(e); }
});

router.get('/', requireAuth, requireAdmin, async (_req, res, next) => {
  try { res.json(await svc.listAll()); } catch (e) { next(e); }
});

router.post(
  '/',
  requireAuth, requireAdmin,
  validate(z.object({
    title: z.string().min(3).max(120),
    description: z.string().max(2000).optional(),
    bannerUrl: z.string().url().optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    rewardCoins: z.number().int().min(0).optional(),
  })),
  async (req, res, next) => {
    try { res.status(201).json(await svc.create(req.body)); } catch (e) { next(e); }
  }
);

router.post(
  '/:id/active',
  requireAuth, requireAdmin,
  validate(z.object({ isActive: z.boolean() })),
  async (req, res, next) => {
    try { res.json(await svc.setActive(req.params.id, req.body.isActive)); } catch (e) { next(e); }
  }
);

export default router;
