import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as svc from './referrals.service';

const router = Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try { res.json(await svc.myReferralSummary(req.user!.id)); } catch (e) { next(e); }
});

export default router;
