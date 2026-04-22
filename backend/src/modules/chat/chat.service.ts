import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../lib/errors';
import { ChatChannelType, RoleName } from '@prisma/client';

export async function ensureSystemChannels() {
  // global
  const global = await prisma.chatChannel.findFirst({ where: { type: ChatChannelType.GLOBAL } });
  if (!global) await prisma.chatChannel.create({ data: { type: ChatChannelType.GLOBAL, name: 'Global' } });
  const vip = await prisma.chatChannel.findFirst({ where: { type: ChatChannelType.VIP } });
  if (!vip) await prisma.chatChannel.create({ data: { type: ChatChannelType.VIP, name: 'VIP Lounge' } });
  const support = await prisma.chatChannel.findFirst({ where: { type: ChatChannelType.SUPPORT } });
  if (!support) await prisma.chatChannel.create({ data: { type: ChatChannelType.SUPPORT, name: 'Support' } });
}

export async function listMyChannels(userId: string, roles: RoleName[]) {
  const memberships = await prisma.chatMembership.findMany({
    where: { userId },
    include: { channel: true },
  });
  const ownChannelIds = new Set(memberships.map(m => m.channelId));
  const systemChannels = await prisma.chatChannel.findMany({
    where: {
      OR: [
        { type: ChatChannelType.GLOBAL },
        { type: ChatChannelType.SUPPORT },
        ...(roles.includes(RoleName.VIP) ? [{ type: ChatChannelType.VIP }] : []),
      ],
    },
  });
  const allChannels = [
    ...memberships.map(m => m.channel),
    ...systemChannels.filter(c => !ownChannelIds.has(c.id)),
  ];
  return allChannels;
}

export async function openPrivateChannel(userA: string, userB: string) {
  if (userA === userB) throw badRequest('Cannot DM yourself');
  const [a, b] = [userA, userB].sort();
  const refId = `${a}:${b}`;
  const existing = await prisma.chatChannel.findFirst({
    where: { type: ChatChannelType.PRIVATE, refId },
  });
  if (existing) return existing;
  const channel = await prisma.chatChannel.create({
    data: { type: ChatChannelType.PRIVATE, refId, name: null },
  });
  await prisma.chatMembership.createMany({
    data: [{ channelId: channel.id, userId: userA }, { channelId: channel.id, userId: userB }],
  });
  return channel;
}

export async function canAccessChannel(channelId: string, userId: string, roles: RoleName[]) {
  const channel = await prisma.chatChannel.findUnique({ where: { id: channelId } });
  if (!channel) return false;
  if (channel.type === ChatChannelType.GLOBAL) return true;
  if (channel.type === ChatChannelType.SUPPORT) return true;
  if (channel.type === ChatChannelType.VIP) return roles.includes(RoleName.VIP) || isStaff(roles);
  const m = await prisma.chatMembership.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });
  return !!m || isStaff(roles);
}

function isStaff(roles: RoleName[]) {
  const staff: RoleName[] = [RoleName.OWNER, RoleName.CO_OWNER, RoleName.ADMIN, RoleName.MODERATOR];
  return roles.some(r => staff.includes(r));
}

export async function listMessages(channelId: string, userId: string, roles: RoleName[], limit = 50, beforeId?: string) {
  const ok = await canAccessChannel(channelId, userId, roles);
  if (!ok) throw forbidden('No access to channel');
  return prisma.chatMessage.findMany({
    where: { channelId, deletedAt: null, ...(beforeId ? { id: { lt: beforeId } } : {}) },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 200),
    include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
  });
}

export async function sendMessage(userId: string, roles: RoleName[], channelId: string, body: string, attachmentUrl?: string) {
  const ok = await canAccessChannel(channelId, userId, roles);
  if (!ok) throw forbidden('No access to channel');
  if (body.length === 0 && !attachmentUrl) throw badRequest('Empty message');
  const membership = await prisma.chatMembership.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });
  if (membership?.mutedUntil && membership.mutedUntil > new Date()) throw forbidden('Muted');
  return prisma.chatMessage.create({
    data: { channelId, senderId: userId, body, attachmentUrl },
    include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
  });
}

export async function markRead(messageId: string, userId: string) {
  return prisma.messageRead.upsert({
    where: { messageId_userId: { messageId, userId } },
    update: {}, create: { messageId, userId },
  });
}

export async function deleteMessage(messageId: string, actorId: string, roles: RoleName[]) {
  const m = await prisma.chatMessage.findUnique({ where: { id: messageId } });
  if (!m) throw notFound();
  const staff = isStaff(roles);
  if (m.senderId !== actorId && !staff) throw forbidden();
  return prisma.chatMessage.update({ where: { id: messageId }, data: { deletedAt: new Date() } });
}

export async function muteUser(channelId: string, userId: string, minutes: number) {
  const until = new Date(Date.now() + minutes * 60_000);
  return prisma.chatMembership.upsert({
    where: { channelId_userId: { channelId, userId } },
    update: { mutedUntil: until },
    create: { channelId, userId, mutedUntil: until },
  });
}
