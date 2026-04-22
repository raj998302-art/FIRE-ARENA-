import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';

export async function listActive() {
  const now = new Date();
  return prisma.event.findMany({
    where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { endsAt: 'asc' },
  });
}

export async function listAll() {
  return prisma.event.findMany({ orderBy: { startsAt: 'desc' }, take: 100 });
}

export async function create(data: {
  title: string; description?: string; bannerUrl?: string;
  startsAt: string; endsAt: string; rewardCoins?: number;
}) {
  return prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      bannerUrl: data.bannerUrl,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      rewardCoins: data.rewardCoins ?? 0,
    },
  });
}

export async function setActive(id: string, isActive: boolean) {
  const e = await prisma.event.findUnique({ where: { id } });
  if (!e) throw notFound('Event not found');
  return prisma.event.update({ where: { id }, data: { isActive } });
}
