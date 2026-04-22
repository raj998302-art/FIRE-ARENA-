import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireMod } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as svc from './chat.service';

const router = Router();

router.get('/channels', requireAuth, async (req, res, next) => {
  try { res.json(await svc.listMyChannels(req.user!.id, req.user!.roles)); } catch (e) { next(e); }
});

router.post(
  '/channels/private',
  requireAuth,
  validate(z.object({ otherUserId: z.string().uuid() })),
  async (req, res, next) => {
    try { res.json(await svc.openPrivateChannel(req.user!.id, req.body.otherUserId)); } catch (e) { next(e); }
  }
);

router.get('/channels/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const limit = parseInt((req.query.limit as string) ?? '50', 10);
    res.json(await svc.listMessages(req.params.id, req.user!.id, req.user!.roles, limit, req.query.before as string | undefined));
  } catch (e) { next(e); }
});

router.post(
  '/channels/:id/messages',
  requireAuth,
  validate(z.object({ body: z.string().max(2000).default(''), attachmentUrl: z.string().url().optional() })),
  async (req, res, next) => {
    try { res.json(await svc.sendMessage(req.user!.id, req.user!.roles, req.params.id, req.body.body, req.body.attachmentUrl)); } catch (e) { next(e); }
  }
);

router.post('/messages/:id/read', requireAuth, async (req, res, next) => {
  try { res.json(await svc.markRead(req.params.id, req.user!.id)); } catch (e) { next(e); }
});

router.delete('/messages/:id', requireAuth, async (req, res, next) => {
  try { res.json(await svc.deleteMessage(req.params.id, req.user!.id, req.user!.roles)); } catch (e) { next(e); }
});

router.post(
  '/channels/:id/mute',
  requireAuth, requireMod,
  validate(z.object({ userId: z.string().uuid(), minutes: z.number().int().min(1).max(10080) })),
  async (req, res, next) => {
    try { res.json(await svc.muteUser(req.params.id, req.body.userId, req.body.minutes)); } catch (e) { next(e); }
  }
);

export default router;
