import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as svc from './notifications.service';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try { res.json(await svc.list(req.user!.id)); } catch (e) { next(e); }
});

router.post('/read-all', requireAuth, async (req, res, next) => {
  try { res.json(await svc.markAllRead(req.user!.id)); } catch (e) { next(e); }
});

export default router;
