import { prisma } from '../../lib/prisma';
import { sendPushToUsers } from '../../lib/onesignal';
import { NotificationType } from '@prisma/client';

export async function push(input: {
  userId: string; type: NotificationType; title: string; body: string; data?: any;
}) {
  const n = await prisma.notification.create({ data: input });
  // Best-effort push; failures are logged, never thrown.
  sendPushToUsers([input.userId], input.title, input.body, { type: input.type, ...(input.data ?? {}) })
    .catch(() => {});
  return n;
}

export async function broadcast(userIds: string[], type: NotificationType, title: string, body: string, data?: any) {
  if (userIds.length === 0) return 0;
  const res = await prisma.notification.createMany({
    data: userIds.map(userId => ({ userId, type, title, body, data })),
  });
  sendPushToUsers(userIds, title, body, { type, ...(data ?? {}) }).catch(() => {});
  return res.count;
}

export async function list(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 200),
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
