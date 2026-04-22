import { prisma } from '../../lib/prisma';
import { badRequest, notFound } from '../../lib/errors';
import { postTransaction } from '../wallet/wallet.service';
import { RoleName, TxType } from '@prisma/client';
import * as notif from '../notifications/notifications.service';

export async function listUsers(search?: string, limit = 50, cursor?: string) {
  return prisma.user.findMany({
    where: search
      ? { OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ] }
      : undefined,
    take: Math.min(limit, 200),
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: { wallet: true, roles: { include: { role: true } } },
  });
}

export async function getUser(id: string) {
  const u = await prisma.user.findUnique({
    where: { id },
    include: {
      wallet: true,
      roles: { include: { role: true } },
      vipSubscriptions: { orderBy: { expiresAt: 'desc' }, take: 3 },
    },
  });
  if (!u) throw notFound('User not found');
  const { passwordHash, ...rest } = u;
  return rest;
}

export async function addRole(userId: string, role: RoleName, grantedBy: string) {
  const r = await prisma.role.upsert({ where: { name: role }, update: {}, create: { name: role } });
  return prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: r.id } },
    update: { grantedBy },
    create: { userId, roleId: r.id, grantedBy },
  });
}

export async function removeRole(userId: string, role: RoleName) {
  const r = await prisma.role.findUnique({ where: { name: role } });
  if (!r) return { ok: true };
  await prisma.userRole.deleteMany({ where: { userId, roleId: r.id } });
  return { ok: true };
}

export async function banUser(userId: string, reason: string) {
  return prisma.user.update({ where: { id: userId }, data: { isBanned: true, banReason: reason } });
}

export async function unbanUser(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { isBanned: false, banReason: null } });
}

export async function adjustBalance(userId: string, delta: number, note: string) {
  if (delta === 0) throw badRequest('Delta must be non-zero');
  return prisma.$transaction(async (tx) => {
    if (delta > 0) {
      await postTransaction({
        userId, type: TxType.ADMIN_ADJUST, amountCoins: delta,
        note: `Admin credit: ${note}`, tx,
      });
    } else {
      await postTransaction({
        userId, type: TxType.ADMIN_ADJUST, amountCoins: -delta,
        note: `Admin debit: ${note}`, tx,
      });
    }
    return { ok: true };
  });
}

export async function getStats() {
  const [
    userCount, activeVip, pendingUtr, pendingWd, tournaments,
    totalDeposited, totalWithdrawn,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.vipSubscription.count({ where: { expiresAt: { gt: new Date() } } }),
    prisma.payment.count({ where: { provider: 'MANUAL_UPI', status: 'PENDING_APPROVAL' } }),
    prisma.withdrawal.count({ where: { status: 'PENDING' } }),
    prisma.tournament.count(),
    prisma.wallet.aggregate({ _sum: { totalDeposited: true } }),
    prisma.wallet.aggregate({ _sum: { totalWithdrawn: true } }),
  ]);
  return {
    userCount, activeVip, pendingUtr, pendingWd, tournaments,
    totalDeposited: totalDeposited._sum.totalDeposited ?? 0,
    totalWithdrawn: totalWithdrawn._sum.totalWithdrawn ?? 0,
  };
}

export async function setMaintenance(enabled: boolean, message?: string) {
  await prisma.setting.upsert({
    where: { key: 'maintenance' },
    update: { value: JSON.stringify({ enabled, message }) },
    create: { key: 'maintenance', value: JSON.stringify({ enabled, message }) },
  });
  return { enabled, message };
}

export async function getMaintenance() {
  const s = await prisma.setting.findUnique({ where: { key: 'maintenance' } });
  if (!s) return { enabled: false };
  try { return JSON.parse(s.value); } catch { return { enabled: false }; }
}

export async function createBroadcast(actorId: string, title: string, body: string) {
  const b = await prisma.broadcastMessage.create({ data: { title, body, createdById: actorId } });
  // push a notification to all users (kept simple; for very large user bases this should be queued)
  const users = await prisma.user.findMany({ select: { id: true }, where: { isBanned: false } });
  await notif.broadcast(users.map(u => u.id), 'SYSTEM', title, body, { broadcastId: b.id });
  return b;
}

export async function listAuditLogs(limit = 100) {
  return prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: Math.min(limit, 500) });
}
