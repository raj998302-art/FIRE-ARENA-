import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { unauthorized, forbidden } from '../lib/errors';
import { RoleName } from '@prisma/client';

export interface AuthUser {
  id: string;
  username: string;
  roles: RoleName[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(unauthorized('Missing token'));
  const token = header.slice(7);
  try {
    const p = verifyToken(token);
    if (p.type !== 'access') return next(unauthorized('Not an access token'));
    req.user = { id: p.sub, username: p.username, roles: p.roles as RoleName[] };
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const p = verifyToken(header.slice(7));
    if (p.type === 'access') {
      req.user = { id: p.sub, username: p.username, roles: p.roles as RoleName[] };
    }
  } catch { /* ignore */ }
  next();
}

export function requireRoles(...allowed: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(unauthorized());
    const has = req.user.roles.some(r => allowed.includes(r));
    if (!has) return next(forbidden('Insufficient role'));
    next();
  };
}

export const requireAdmin = requireRoles(
  RoleName.OWNER, RoleName.CO_OWNER, RoleName.ADMIN, RoleName.FAM_MANAGER
);
export const requireOwner = requireRoles(RoleName.OWNER, RoleName.CO_OWNER);
export const requirePaymentMgr = requireRoles(
  RoleName.OWNER, RoleName.CO_OWNER, RoleName.ADMIN, RoleName.PAYMENT_MANAGER
);
export const requireTournamentMgr = requireRoles(
  RoleName.OWNER, RoleName.CO_OWNER, RoleName.ADMIN, RoleName.TOURNAMENT_MANAGER
);
export const requireMod = requireRoles(
  RoleName.OWNER, RoleName.CO_OWNER, RoleName.ADMIN, RoleName.MODERATOR
);
