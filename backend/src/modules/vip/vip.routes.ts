import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as svc from './vip.service';

const router = Router();

router.get('/plans', async (_req, res, next) => {
  try { res.json(await svc.listPlans()); } catch (e) { next(e); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try { res.json(await svc.myStatus(req.user!.id)); } catch (e) { next(e); }
});

router.post(
  '/purchase',
  requireAuth,
  validate(z.object({ planCode: z.string() })),
  async (req, res, next) => {
    try { res.json(await svc.purchase(req.user!.id, req.body.planCode)); } catch (e) { next(e); }
  }
);

export default router;
