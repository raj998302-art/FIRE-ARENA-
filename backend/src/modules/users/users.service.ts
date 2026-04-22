import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';
import { RoleName } from '@prisma/client';

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true,
      roles: { include: { role: true } },
      vipSubscriptions: { orderBy: { expiresAt: 'desc' }, take: 1 },
    },
  });
  if (!user) throw notFound('User not found');
  const { passwordHash, ...rest } = user;
  return {
    ...rest,
    roles: user.roles.map(r => r.role.name),
    vip: user.vipSubscriptions[0] && user.vipSubscriptions[0].expiresAt > new Date()
      ? { expiresAt: user.vipSubscriptions[0].expiresAt } : null,
  };
}

export async function updateMe(userId: string, data: {
  displayName?: string; gameUid?: string; avatarUrl?: string;
}) {
  return prisma.user.update({ where: { id: userId }, data });
}

export async function activeRoles(userId: string): Promise<RoleName[]> {
  const rows = await prisma.userRole.findMany({
    where: { userId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    include: { role: true },
  });
  return rows.map(r => r.role.name);
}

export async function publicProfile(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, displayName: true, avatarUrl: true, createdAt: true },
  });
  if (!user) throw notFound('User not found');
  return user;
}
