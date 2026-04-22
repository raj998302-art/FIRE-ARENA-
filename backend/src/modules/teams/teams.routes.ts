import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as svc from './teams.service';

const router = Router();

router.get('/', async (_req, res, next) => { try { res.json(await svc.listTeams()); } catch (e) { next(e); } });
router.get('/me', requireAuth, async (req, res, next) => { try { res.json(await svc.myTeams(req.user!.id)); } catch (e) { next(e); } });
router.get('/:id', async (req, res, next) => { try { res.json(await svc.getTeam(req.params.id)); } catch (e) { next(e); } });

router.post(
  '/',
  requireAuth,
  validate(z.object({
    name: z.string().min(3).max(32),
    tag: z.string().min(2).max(6).regex(/^[A-Z0-9]+$/),
    description: z.string().max(500).optional(),
    logoUrl: z.string().url().optional(),
  })),
  async (req, res, next) => { try { res.status(201).json(await svc.createTeam(req.user!.id, req.body)); } catch (e) { next(e); } }
);

router.post('/:id/join', requireAuth, async (req, res, next) => {
  try { res.json(await svc.joinTeam(req.params.id, req.user!.id)); } catch (e) { next(e); }
});
router.post('/:id/leave', requireAuth, async (req, res, next) => {
  try { res.json(await svc.leaveTeam(req.params.id, req.user!.id)); } catch (e) { next(e); }
});
router.post(
  '/:id/kick',
  requireAuth,
  validate(z.object({ userId: z.string().uuid() })),
  async (req, res, next) => {
    try { res.json(await svc.kickMember(req.params.id, req.user!.id, req.body.userId)); } catch (e) { next(e); }
  }
);

export default router;
