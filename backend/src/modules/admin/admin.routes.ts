import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin, requireOwner } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { RoleName } from '@prisma/client';
import * as svc from './admin.service';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/users', async (req, res, next) => {
  try {
    const limit = parseInt((req.query.limit as string) ?? '50', 10);
    const cursor = req.query.cursor as string | undefined;
    res.json(await svc.listUsers(req.query.search as string | undefined, limit, cursor));
  } catch (e) { next(e); }
});

router.get('/users/:id', async (req, res, next) => {
  try { res.json(await svc.getUser(req.params.id)); } catch (e) { next(e); }
});

router.post(
  '/users/:id/roles/add',
  validate(z.object({ role: z.nativeEnum(RoleName) })),
  async (req, res, next) => {
    try { res.json(await svc.addRole(req.params.id, req.body.role, req.user!.id)); } catch (e) { next(e); }
  }
);

router.post(
  '/users/:id/roles/remove',
  validate(z.object({ role: z.nativeEnum(RoleName) })),
  async (req, res, next) => {
    try { res.json(await svc.removeRole(req.params.id, req.body.role)); } catch (e) { next(e); }
  }
);

router.post(
  '/users/:id/ban',
  validate(z.object({ reason: z.string().min(1).max(500) })),
  async (req, res, next) => {
    try { res.json(await svc.banUser(req.params.id, req.body.reason)); } catch (e) { next(e); }
  }
);

router.post('/users/:id/unban', async (req, res, next) => {
  try { res.json(await svc.unbanUser(req.params.id)); } catch (e) { next(e); }
});

router.post(
  '/users/:id/adjust',
  validate(z.object({ delta: z.number().int().refine(v => v !== 0), note: z.string().min(1).max(200) })),
  async (req, res, next) => {
    try { res.json(await svc.adjustBalance(req.params.id, req.body.delta, req.body.note)); } catch (e) { next(e); }
  }
);

router.get('/stats', async (_req, res, next) => {
  try { res.json(await svc.getStats()); } catch (e) { next(e); }
});

router.post(
  '/maintenance',
  requireOwner,
  validate(z.object({ enabled: z.boolean(), message: z.string().optional() })),
  async (req, res, next) => {
    try { res.json(await svc.setMaintenance(req.body.enabled, req.body.message)); } catch (e) { next(e); }
  }
);

router.get('/maintenance', async (_req, res, next) => {
  try { res.json(await svc.getMaintenance()); } catch (e) { next(e); }
});

router.post(
  '/broadcast',
  validate(z.object({ title: z.string().min(1).max(120), body: z.string().min(1).max(2000) })),
  async (req, res, next) => {
    try { res.json(await svc.createBroadcast(req.user!.id, req.body.title, req.body.body)); } catch (e) { next(e); }
  }
);

router.get('/audit', async (_req, res, next) => {
  try { res.json(await svc.listAuditLogs()); } catch (e) { next(e); }
});

export default router;
