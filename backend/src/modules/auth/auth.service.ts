import argon2 from 'argon2';
import { prisma } from '../../lib/prisma';
import { signAccessToken, signRefreshToken, verifyToken } from '../../lib/jwt';
import { badRequest, conflict, unauthorized } from '../../lib/errors';
import { newReferralCode } from '../../utils/ids';
import { env } from '../../config/env';
import { RoleName } from '@prisma/client';

async function userRoleNames(userId: string): Promise<RoleName[]> {
  const rows = await prisma.userRole.findMany({
    where: { userId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    include: { role: true },
  });
  return rows.map(r => r.role.name);
}

async function ensureRole(name: RoleName) {
  return prisma.role.upsert({ where: { name }, update: {}, create: { name } });
}

export async function register(input: {
  email: string; username: string; password: string;
  displayName?: string; gameUid?: string; phone?: string; referralCode?: string;
  ip?: string; ua?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim();
  if (username.length < 3) throw badRequest('Username too short');
  if (input.password.length < 8) throw badRequest('Password too short (min 8 chars)');

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }, ...(input.phone ? [{ phone: input.phone }] : [])] },
  });
  if (existing) throw conflict('Email, username, or phone already registered');

  let referrer = null;
  if (input.referralCode) {
    referrer = await prisma.user.findUnique({ where: { referralCode: input.referralCode } });
    if (!referrer) throw badRequest('Invalid referral code');
  }

  const passwordHash = await argon2.hash(input.password);
  const userRole = await ensureRole(RoleName.USER);

  const user = await prisma.user.create({
    data: {
      email, username, passwordHash,
      displayName: input.displayName ?? username,
      gameUid: input.gameUid,
      phone: input.phone,
      referralCode: newReferralCode(),
      referredById: referrer?.id,
      lastLoginIp: input.ip,
      wallet: { create: {} },
      roles: { create: { roleId: userRole.id } },
    },
    include: { wallet: true },
  });

  const session = await createSession(user.id, input.ip, input.ua);
  const roles = [RoleName.USER];
  const accessToken = signAccessToken({ sub: user.id, username: user.username, roles });
  return { user, accessToken, refreshToken: session.refreshToken };
}

export async function login(input: { identifier: string; password: string; ip?: string; ua?: string }) {
  const id = input.identifier.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: id }, { username: input.identifier.trim() }] },
  });
  if (!user) throw unauthorized('Invalid credentials');
  if (user.isBanned) throw unauthorized('Account is banned: ' + (user.banReason ?? 'no reason'));
  const ok = await argon2.verify(user.passwordHash, input.password);
  if (!ok) throw unauthorized('Invalid credentials');

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginIp: input.ip ?? user.lastLoginIp } });
  const roles = await userRoleNames(user.id);
  const session = await createSession(user.id, input.ip, input.ua);
  const accessToken = signAccessToken({ sub: user.id, username: user.username, roles });
  return { user, roles, accessToken, refreshToken: session.refreshToken };
}

export async function refresh(refreshToken: string) {
  const session = await prisma.session.findUnique({ where: { refreshToken } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw unauthorized('Invalid refresh token');
  }
  try { verifyToken(refreshToken); } catch { throw unauthorized('Invalid refresh token'); }
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.isBanned) throw unauthorized();
  const roles = await userRoleNames(user.id);
  const accessToken = signAccessToken({ sub: user.id, username: user.username, roles });
  return { accessToken };
}

export async function logout(refreshToken: string) {
  await prisma.session.updateMany({
    where: { refreshToken, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function logoutAll(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function createSession(userId: string, ip?: string, ua?: string) {
  const refreshToken = signRefreshToken({ sub: userId, username: userId, roles: [] });
  const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES));
  return prisma.session.create({
    data: { userId, refreshToken, ip, userAgent: ua, expiresAt },
  });
}

function parseDuration(s: string): number {
  const m = /^(\d+)([smhd])$/.exec(s);
  if (!m) return 30 * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const mult: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * mult[m[2]];
}
