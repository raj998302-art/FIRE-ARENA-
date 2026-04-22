import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireTournamentMgr } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as svc from './tournaments.service';
import { TournamentStatus } from '@prisma/client';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status as TournamentStatus | undefined;
    res.json(await svc.listTournaments({ status }));
  } catch (e) { next(e); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try { res.json(await svc.listMyEntries(req.user!.id)); } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await svc.getTournament(req.params.id)); } catch (e) { next(e); }
});

const createSchema = z.object({
  title: z.string().min(3).max(100),
  game: z.string().max(40).optional(),
  mode: z.string().max(40).optional(),
  description: z.string().max(2000).optional(),
  bannerUrl: z.string().url().optional(),
  entryFeeCoins: z.number().int().min(0).max(10000),
  prizePoolCoins: z.number().int().min(0).max(10000000),
  maxSlots: z.number().int().min(2).max(100),
  startAt: z.string().datetime(),
  lockAt: z.string().datetime(),
  vipOnly: z.boolean().optional(),
  rules: z.string().max(5000).optional(),
});

router.post('/', requireAuth, requireTournamentMgr, validate(createSchema), async (req, res, next) => {
  try { res.status(201).json(await svc.createTournament(req.user!.id, req.body)); } catch (e) { next(e); }
});

router.patch('/:id', requireAuth, requireTournamentMgr, validate(createSchema.partial()), async (req, res, next) => {
  try { res.json(await svc.updateTournament(req.params.id, req.body)); } catch (e) { next(e); }
});

router.post(
  '/:id/status',
  requireAuth, requireTournamentMgr,
  validate(z.object({ status: z.nativeEnum(TournamentStatus) })),
  async (req, res, next) => {
    try { res.json(await svc.setStatus(req.params.id, req.body.status)); } catch (e) { next(e); }
  }
);

router.post(
  '/:id/room',
  requireAuth, requireTournamentMgr,
  validate(z.object({ roomId: z.string().min(1), roomPassword: z.string().min(1) })),
  async (req, res, next) => {
    try { res.json(await svc.publishRoom(req.params.id, req.body.roomId, req.body.roomPassword)); } catch (e) { next(e); }
  }
);

router.post(
  '/:id/join',
  requireAuth,
  validate(z.object({ gameUid: z.string().min(3).max(32), teamId: z.string().uuid().optional() })),
  async (req, res, next) => {
    try { res.json(await svc.joinTournament(req.user!.id, req.params.id, req.body)); } catch (e) { next(e); }
  }
);

router.post('/:id/leave', requireAuth, async (req, res, next) => {
  try { res.json(await svc.leaveTournament(req.user!.id, req.params.id)); } catch (e) { next(e); }
});

router.post(
  '/:id/results',
  requireAuth, requireTournamentMgr,
  validate(z.object({
    results: z.array(z.object({
      userId: z.string().uuid(),
      kills: z.number().int().min(0).optional(),
      prizeCoins: z.number().int().min(0),
    })).min(1),
  })),
  async (req, res, next) => {
    try { res.json(await svc.submitResults(req.params.id, req.body.results)); } catch (e) { next(e); }
  }
);

export default router;
