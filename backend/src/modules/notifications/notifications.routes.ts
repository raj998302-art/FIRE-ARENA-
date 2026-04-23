import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { prisma } from '../../lib/prisma';
import * as svc from './notifications.service';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try { res.json(await svc.list(req.user!.id)); } catch (e) { next(e); }
});

router.post('/read-all', requireAuth, async (req, res, next) => {
  try { res.json(await svc.markAllRead(req.user!.id)); } catch (e) { next(e); }
});

/**
 * Persist the OneSignal player id (a.k.a. external_user_id handled server-side
 * by includeExternalUserIds) so we can push by userId. Clients POST their
 * OneSignal player id on login / foreground.
 */
router.post(
  '/push-token',
  requireAuth,
  validate(z.object({ pushPlayerId: z.string().min(8).max(128) })),
  async (req, res, next) => {
    try {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { pushPlayerId: req.body.pushPlayerId },
      });
      res.json({ ok: true });
    } catch (e) { next(e); }
  }
);

export default router;
