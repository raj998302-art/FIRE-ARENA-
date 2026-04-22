import { prisma } from '../../lib/prisma';

export async function topByWinnings(limit = 20) {
  const rows = await prisma.tournamentResult.groupBy({
    by: ['userId'],
    _sum: { prizeCoins: true, kills: true },
    orderBy: { _sum: { prizeCoins: 'desc' } },
    take: Math.min(limit, 100),
  });
  const userIds = rows.map(r => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, avatarUrl: true },
  });
  const byId = new Map(users.map(u => [u.id, u]));
  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    user: byId.get(r.userId),
    prizeCoins: r._sum.prizeCoins ?? 0,
    kills: r._sum.kills ?? 0,
  }));
}

export async function topByKills(limit = 20) {
  const rows = await prisma.tournamentResult.groupBy({
    by: ['userId'],
    _sum: { kills: true, prizeCoins: true },
    orderBy: { _sum: { kills: 'desc' } },
    take: Math.min(limit, 100),
  });
  const userIds = rows.map(r => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, avatarUrl: true },
  });
  const byId = new Map(users.map(u => [u.id, u]));
  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    user: byId.get(r.userId),
    kills: r._sum.kills ?? 0,
    prizeCoins: r._sum.prizeCoins ?? 0,
  }));
}

export async function topReferrers(limit = 20) {
  const rows = await prisma.referralReward.groupBy({
    by: ['referrerId'],
    _sum: { rewardCoins: true },
    _count: { _all: true },
    orderBy: { _sum: { rewardCoins: 'desc' } },
    take: Math.min(limit, 100),
  });
  const userIds = rows.map(r => r.referrerId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, avatarUrl: true },
  });
  const byId = new Map(users.map(u => [u.id, u]));
  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.referrerId,
    user: byId.get(r.referrerId),
    referralCount: r._count._all,
    earnedCoins: r._sum.rewardCoins ?? 0,
  }));
}
