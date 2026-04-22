import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as svc from './wallet.service';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try { res.json(await svc.getWallet(req.user!.id)); } catch (e) { next(e); }
});

router.get('/transactions', requireAuth, async (req, res, next) => {
  try {
    const limit = parseInt((req.query.limit as string) ?? '50', 10);
    const cursor = req.query.cursor as string | undefined;
    res.json(await svc.listTransactions(req.user!.id, limit, cursor));
  } catch (e) { next(e); }
});

export default router;
