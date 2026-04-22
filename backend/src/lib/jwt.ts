import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;         // user id
  username: string;
  roles: string[];
  type: 'access' | 'refresh';
}

export function signAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES as any };
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_SECRET, opts);
}

export function signRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES as any };
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_SECRET, opts);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
