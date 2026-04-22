import { Router } from 'express';
import * as svc from './leaderboard.service';

const router = Router();

router.get('/winnings', async (_req, res, next) => {
  try { res.json(await svc.topByWinnings()); } catch (e) { next(e); }
});
router.get('/kills', async (_req, res, next) => {
  try { res.json(await svc.topByKills()); } catch (e) { next(e); }
});
router.get('/referrers', async (_req, res, next) => {
  try { res.json(await svc.topReferrers()); } catch (e) { next(e); }
});

export default router;
