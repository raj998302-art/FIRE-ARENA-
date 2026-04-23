import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/error';
import { globalLimiter } from './middleware/rateLimit';
import { getMaintenance } from './modules/admin/admin.service';

import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import withdrawalsRoutes from './modules/withdrawals/withdrawals.routes';
import tournamentsRoutes from './modules/tournaments/tournaments.routes';
import vipRoutes from './modules/vip/vip.routes';
import teamsRoutes from './modules/teams/teams.routes';
import referralsRoutes from './modules/referrals/referrals.routes';
import chatRoutes from './modules/chat/chat.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import adminRoutes from './modules/admin/admin.routes';
import eventsRoutes from './modules/events/events.routes';
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes';
import rewardsRoutes from './modules/rewards/rewards.routes';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));
  app.use(globalLimiter);

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'fire-arena-max', time: new Date().toISOString() }));

  app.get('/api/status', async (_req, res) => {
    const m = await getMaintenance();
    res.json({ maintenance: m, version: '0.1.0' });
  });

  // Block write routes when maintenance is on, EXCEPT admin and auth. Auth
  // must stay open so admins can refresh tokens / log in to turn maintenance
  // back off — otherwise a >15min (access-token lifetime) maintenance window
  // becomes a lockout that only direct DB access can resolve.
  app.use(async (req, res, next) => {
    if (req.method === 'GET'
      || req.path.startsWith('/api/admin')
      || req.path.startsWith('/api/auth')
      || req.path === '/health') return next();
    const m = await getMaintenance();
    if (m?.enabled) return res.status(503).json({ error: 'MAINTENANCE', message: m.message ?? 'Service under maintenance' });
    next();
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/withdrawals', withdrawalsRoutes);
  app.use('/api/tournaments', tournamentsRoutes);
  app.use('/api/vip', vipRoutes);
  app.use('/api/teams', teamsRoutes);
  app.use('/api/referrals', referralsRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/events', eventsRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/rewards', rewardsRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }));
  app.use(errorHandler);
  return app;
}
