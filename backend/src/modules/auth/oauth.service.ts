import { prisma } from '../../lib/prisma';
import { signAccessToken, signRefreshToken } from '../../lib/jwt';
import { badRequest, unauthorized } from '../../lib/errors';
import { newReferralCode } from '../../utils/ids';
import { env } from '../../config/env';
import { RoleName } from '@prisma/client';
import argon2 from 'argon2';
import crypto from 'crypto';

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

async function createSession(userId: string, ip?: string, ua?: string) {
  const refreshToken = signRefreshToken({ sub: userId, username: userId, roles: [] });
  const expiresMs = 30 * 86400_000;
  return prisma.session.create({
    data: { userId, refreshToken, ip, userAgent: ua, expiresAt: new Date(Date.now() + expiresMs) },
  });
}

/** Normalizes a username candidate and ensures uniqueness by suffixing digits. */
async function uniqueUsername(seed: string): Promise<string> {
  const base = seed.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 18) || 'player';
  for (let i = 0; i < 50; i++) {
    const suffix = i === 0 ? '' : String(Math.floor(Math.random() * 10_000));
    const candidate = `${base}${suffix}`;
    const clash = await prisma.user.findUnique({ where: { username: candidate } });
    if (!clash) return candidate;
  }
  return `${base}${crypto.randomBytes(3).toString('hex')}`;
}

/**
 * Verify a Google ID token against tokeninfo. Returns { sub, email, name, picture }.
 * We intentionally call the public tokeninfo endpoint instead of pulling google-auth-library
 * to keep deps slim; in production swap to library-side verification with cached JWKS.
 */
async function verifyGoogleIdToken(idToken: string) {
  if (!env.GOOGLE_OAUTH_CLIENT_ID) throw badRequest('Google OAuth not configured');
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!res.ok) throw unauthorized('Invalid Google ID token');
  const p = await res.json() as any;
  if (!p.sub || !p.aud) throw unauthorized('Bad Google token payload');
  // `aud` must match our client id.
  if (p.aud !== env.GOOGLE_OAUTH_CLIENT_ID) throw unauthorized('Google token audience mismatch');
  if (p.exp && Number(p.exp) * 1000 < Date.now()) throw unauthorized('Google token expired');
  return {
    sub: String(p.sub),
    email: (p.email ?? '').toLowerCase(),
    name: p.name as string | undefined,
    picture: p.picture as string | undefined,
    emailVerified: p.email_verified === 'true' || p.email_verified === true,
  };
}

/**
 * Google sign-in: the Android client (Credential Manager / Sign-In) exchanges with Google
 * and POSTs us the ID token. We verify and upsert the user on our side.
 */
export async function signInWithGoogle(idToken: string, ip?: string, ua?: string) {
  const g = await verifyGoogleIdToken(idToken);
  if (!g.email || !g.emailVerified) throw unauthorized('Google email not verified');

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: g.sub }, { email: g.email }] },
  });

  if (!user) {
    const username = await uniqueUsername(g.email.split('@')[0]);
    const userRole = await ensureRole(RoleName.USER);
    user = await prisma.user.create({
      data: {
        email: g.email,
        username,
        passwordHash: await argon2.hash(crypto.randomBytes(24).toString('hex')),
        displayName: g.name ?? username,
        avatarUrl: g.picture,
        googleId: g.sub,
        referralCode: newReferralCode(),
        lastLoginIp: ip,
        wallet: { create: {} },
        roles: { create: { roleId: userRole.id } },
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: g.sub, avatarUrl: user.avatarUrl ?? g.picture },
    });
  }

  if (user.isBanned) throw unauthorized('Account banned: ' + (user.banReason ?? ''));

  const roles = await userRoleNames(user.id);
  const session = await createSession(user.id, ip, ua);
  const accessToken = signAccessToken({ sub: user.id, username: user.username, roles });
  return { user, roles, accessToken, refreshToken: session.refreshToken };
}

/**
 * Discord OAuth2 code exchange. The client (Android) completes the browser flow
 * and POSTs us the short-lived code; we exchange it for the user profile.
 */
export async function signInWithDiscord(code: string, redirectUri: string, ip?: string, ua?: string) {
  if (!env.DISCORD_OAUTH_CLIENT_ID || !env.DISCORD_OAUTH_CLIENT_SECRET) {
    throw badRequest('Discord OAuth not configured');
  }

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.DISCORD_OAUTH_CLIENT_ID,
      client_secret: env.DISCORD_OAUTH_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text().catch(() => '');
    throw unauthorized('Discord token exchange failed: ' + text.slice(0, 200));
  }
  const tok = await tokenRes.json() as { access_token: string };

  const meRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tok.access_token}` },
  });
  if (!meRes.ok) throw unauthorized('Could not fetch Discord profile');
  const dm = await meRes.json() as { id: string; username: string; email?: string; avatar?: string; verified?: boolean };

  const discordId = dm.id;
  const email = (dm.email ?? '').toLowerCase();

  let user = await prisma.user.findFirst({
    where: { OR: [{ discordId }, ...(email ? [{ email }] : [])] },
  });

  if (!user) {
    if (!email || !dm.verified) throw unauthorized('Discord email not verified');
    const username = await uniqueUsername(dm.username || email.split('@')[0]);
    const userRole = await ensureRole(RoleName.USER);
    user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: await argon2.hash(crypto.randomBytes(24).toString('hex')),
        displayName: dm.username ?? username,
        avatarUrl: dm.avatar ? `https://cdn.discordapp.com/avatars/${dm.id}/${dm.avatar}.png` : null,
        discordId,
        referralCode: newReferralCode(),
        lastLoginIp: ip,
        wallet: { create: {} },
        roles: { create: { roleId: userRole.id } },
      },
    });
  } else if (!user.discordId) {
    user = await prisma.user.update({ where: { id: user.id }, data: { discordId } });
  }

  if (user.isBanned) throw unauthorized('Account banned: ' + (user.banReason ?? ''));

  const roles = await userRoleNames(user.id);
  const session = await createSession(user.id, ip, ua);
  const accessToken = signAccessToken({ sub: user.id, username: user.username, roles });
  return { user, roles, accessToken, refreshToken: session.refreshToken };
}
