import { prisma } from '../../lib/prisma';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors';
import { postTransaction } from '../wallet/wallet.service';
import { TournamentStatus, TxType, RoleName } from '@prisma/client';

export async function listTournaments(filter?: { status?: TournamentStatus }) {
  return prisma.tournament.findMany({
    where: filter?.status ? { status: filter.status } : {},
    orderBy: { startAt: 'asc' },
    take: 100,
  });
}

export async function getTournament(id: string) {
  const t = await prisma.tournament.findUnique({
    where: { id },
    include: { entries: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } } },
  });
  if (!t) throw notFound('Tournament not found');
  return t;
}

export async function createTournament(creatorId: string, data: {
  title: string; game?: string; mode?: string; description?: string; bannerUrl?: string;
  entryFeeCoins: number; prizePoolCoins: number; maxSlots: number; startAt: string; lockAt: string;
  vipOnly?: boolean; rules?: string;
}) {
  return prisma.tournament.create({
    data: {
      title: data.title,
      game: data.game ?? 'FreeFire',
      mode: data.mode ?? 'SQUAD',
      description: data.description,
      bannerUrl: data.bannerUrl,
      entryFeeCoins: data.entryFeeCoins,
      prizePoolCoins: data.prizePoolCoins,
      maxSlots: data.maxSlots,
      startAt: new Date(data.startAt),
      lockAt: new Date(data.lockAt),
      status: TournamentStatus.DRAFT,
      vipOnly: data.vipOnly ?? false,
      rules: data.rules,
      createdById: creatorId,
    },
  });
}

export async function updateTournament(id: string, data: Partial<Parameters<typeof createTournament>[1]>) {
  const t = await prisma.tournament.findUnique({ where: { id } });
  if (!t) throw notFound('Tournament not found');
  return prisma.tournament.update({
    where: { id },
    data: {
      ...data,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      lockAt: data.lockAt ? new Date(data.lockAt) : undefined,
    },
  });
}

export async function setStatus(id: string, status: TournamentStatus) {
  const t = await prisma.tournament.findUnique({ where: { id } });
  if (!t) throw notFound('Tournament not found');
  return prisma.tournament.update({ where: { id }, data: { status } });
}

export async function publishRoom(id: string, roomId: string, roomPassword: string) {
  return prisma.tournament.update({
    where: { id },
    data: { roomId, roomPassword, roomPublishedAt: new Date(), status: TournamentStatus.LIVE },
  });
}

export async function joinTournament(userId: string, tournamentId: string, input: {
  gameUid: string; teamId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const t = await tx.tournament.findUnique({ where: { id: tournamentId } });
    if (!t) throw notFound('Tournament not found');
    if (t.status !== TournamentStatus.OPEN) throw badRequest('Tournament not open for entries');
    if (t.lockAt < new Date()) throw badRequest('Registration locked');
    if (t.filledSlots >= t.maxSlots) throw conflict('Tournament full');

    if (t.vipOnly) {
      const vip = await tx.vipSubscription.findFirst({
        where: { userId, expiresAt: { gt: new Date() } },
      });
      if (!vip) throw forbidden('This tournament is VIP-only');
    }

    const already = await tx.tournamentEntry.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } },
    });
    if (already) throw conflict('Already joined');

    if (t.entryFeeCoins > 0) {
      await postTransaction({
        userId, type: TxType.TOURNAMENT_ENTRY, amountCoins: t.entryFeeCoins,
        referenceId: tournamentId, referenceKind: 'tournament',
        note: `Entry fee — ${t.title}`, tx,
      });
    }

    const entry = await tx.tournamentEntry.create({
      data: {
        tournamentId, userId, gameUid: input.gameUid,
        teamId: input.teamId,
        paidCoins: t.entryFeeCoins,
        slotNo: t.filledSlots + 1,
      },
    });
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { filledSlots: { increment: 1 } },
    });
    return entry;
  });
}

export async function leaveTournament(userId: string, tournamentId: string) {
  return prisma.$transaction(async (tx) => {
    const entry = await tx.tournamentEntry.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } },
      include: { tournament: true },
    });
    if (!entry) throw notFound('Entry not found');
    if (entry.tournament.status !== TournamentStatus.OPEN) throw badRequest('Cannot leave after lock');
    if (entry.paidCoins > 0) {
      await postTransaction({
        userId, type: TxType.REFUND, amountCoins: entry.paidCoins,
        referenceId: tournamentId, referenceKind: 'tournament',
        note: 'Tournament leave refund', tx,
      });
    }
    await tx.tournamentEntry.delete({ where: { id: entry.id } });
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { filledSlots: { decrement: 1 } },
    });
    return { ok: true };
  });
}

/** Admin: submit results and disburse prizes. results is an ordered list (rank 1 = winner). */
export async function submitResults(tournamentId: string, results: Array<{
  userId: string; kills?: number; prizeCoins: number;
}>) {
  return prisma.$transaction(async (tx) => {
    const t = await tx.tournament.findUnique({ where: { id: tournamentId } });
    if (!t) throw notFound('Tournament not found');
    await tx.tournamentResult.deleteMany({ where: { tournamentId } });
    let rank = 1;
    for (const r of results) {
      await tx.tournamentResult.create({
        data: {
          tournamentId, userId: r.userId, rank,
          kills: r.kills ?? 0, prizeCoins: r.prizeCoins,
        },
      });
      if (r.prizeCoins > 0) {
        await postTransaction({
          userId: r.userId, type: TxType.TOURNAMENT_PRIZE, amountCoins: r.prizeCoins,
          referenceId: tournamentId, referenceKind: 'tournament',
          note: `Prize rank ${rank} — ${t.title}`, tx,
        });
      }
      rank += 1;
    }
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { status: TournamentStatus.COMPLETED },
    });
    return { ok: true, count: results.length };
  });
}

export async function listMyEntries(userId: string) {
  return prisma.tournamentEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { tournament: true },
    take: 100,
  });
}
