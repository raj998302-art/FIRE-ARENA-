import { prisma } from '../../lib/prisma';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors';
import { ChatChannelType } from '@prisma/client';

export async function createTeam(ownerId: string, data: { name: string; tag: string; description?: string; logoUrl?: string }) {
  const existing = await prisma.team.findFirst({ where: { OR: [{ name: data.name }, { tag: data.tag }] } });
  if (existing) throw conflict('Team name or tag already taken');

  return prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        name: data.name, tag: data.tag, description: data.description, logoUrl: data.logoUrl,
        ownerId,
        members: { create: { userId: ownerId, role: 'owner' } },
      },
      include: { members: true },
    });
    const channel = await tx.chatChannel.create({
      data: { type: ChatChannelType.TEAM, refId: team.id, name: team.name },
    });
    await tx.chatMembership.create({ data: { channelId: channel.id, userId: ownerId } });
    return team;
  });
}

export async function listTeams() {
  return prisma.team.findMany({ take: 100, orderBy: { createdAt: 'desc' } });
}

export async function getTeam(id: string) {
  const t = await prisma.team.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
    },
  });
  if (!t) throw notFound('Team not found');
  return t;
}

export async function joinTeam(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw notFound('Team not found');
  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (existing) throw conflict('Already in team');
  const member = await prisma.teamMember.create({ data: { teamId, userId } });
  const channel = await prisma.chatChannel.findFirst({ where: { type: 'TEAM', refId: teamId } });
  if (channel) {
    await prisma.chatMembership.upsert({
      where: { channelId_userId: { channelId: channel.id, userId } },
      update: {}, create: { channelId: channel.id, userId },
    });
  }
  return member;
}

export async function leaveTeam(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw notFound('Team not found');
  if (team.ownerId === userId) throw forbidden('Owner cannot leave; transfer or delete first');
  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userId } },
  });
  return { ok: true };
}

export async function kickMember(teamId: string, actorId: string, memberUserId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw notFound('Team not found');
  if (team.ownerId !== actorId) throw forbidden('Only owner can kick');
  if (team.ownerId === memberUserId) throw badRequest('Cannot kick owner');
  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userId: memberUserId } },
  });
  return { ok: true };
}

export async function myTeams(userId: string) {
  return prisma.team.findMany({
    where: { members: { some: { userId } } },
    include: { members: true },
  });
}
