import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as svc from './users.service';

const router = Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try { res.json(await svc.getMe(req.user!.id)); } catch (e) { next(e); }
});

const updateSchema = z.object({
  displayName: z.string().max(48).optional(),
  gameUid: z.string().max(32).optional(),
  avatarUrl: z.string().url().optional(),
});
router.patch('/me', requireAuth, validate(updateSchema), async (req, res, next) => {
  try {
    const u = await svc.updateMe(req.user!.id, req.body);
    const { passwordHash, ...rest } = u as any;
    res.json(rest);
  } catch (e) { next(e); }
});

router.get('/:username', async (req, res, next) => {
  try { res.json(await svc.publicProfile(req.params.username)); } catch (e) { next(e); }
});

export default router;
