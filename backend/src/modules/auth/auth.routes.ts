import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimit';
import { requireAuth } from '../../middleware/auth';
import * as svc from './auth.service';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(24).regex(/^[A-Za-z0-9_]+$/),
  password: z.string().min(8).max(128),
  displayName: z.string().max(48).optional(),
  gameUid: z.string().max(32).optional(),
  phone: z.string().regex(/^\+?[0-9]{6,15}$/).optional(),
  referralCode: z.string().length(8).optional(),
});

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const result = await svc.register({ ...req.body, ip: req.ip, ua: req.headers['user-agent'] });
    res.status(201).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: sanitizeUser(result.user),
    });
  } catch (e) { next(e); }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const result = await svc.login({ ...req.body, ip: req.ip, ua: req.headers['user-agent'] });
    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      roles: result.roles,
      user: sanitizeUser(result.user),
    });
  } catch (e) { next(e); }
});

router.post('/refresh', validate(z.object({ refreshToken: z.string() })), async (req, res, next) => {
  try { res.json(await svc.refresh(req.body.refreshToken)); } catch (e) { next(e); }
});

router.post('/logout', validate(z.object({ refreshToken: z.string() })), async (req, res, next) => {
  try { await svc.logout(req.body.refreshToken); res.json({ ok: true }); } catch (e) { next(e); }
});

router.post('/logout-all', requireAuth, async (req, res, next) => {
  try { await svc.logoutAll(req.user!.id); res.json({ ok: true }); } catch (e) { next(e); }
});

function sanitizeUser(u: any) {
  if (!u) return u;
  const { passwordHash, ...rest } = u;
  return rest;
}

export default router;
