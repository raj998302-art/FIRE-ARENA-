import { Server as HttpServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import { verifyToken } from '../lib/jwt';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import * as chat from '../modules/chat/chat.service';
import { RoleName } from '@prisma/client';

interface AuthedSocket extends Socket {
  userId: string;
  username: string;
  roles: RoleName[];
}

let io: IOServer | null = null;

export function initIO(server: HttpServer): IOServer {
  io = new IOServer(server, {
    cors: { origin: process.env.CORS_ORIGIN ?? '*' },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || (socket.handshake.query?.token as string);
    if (!token) return next(new Error('no_token'));
    try {
      const p = verifyToken(token);
      if (p.type !== 'access') return next(new Error('bad_token'));
      (socket as AuthedSocket).userId = p.sub;
      (socket as AuthedSocket).username = p.username;
      (socket as AuthedSocket).roles = p.roles as RoleName[];
      next();
    } catch {
      next(new Error('invalid_token'));
    }
  });

  io.on('connection', (raw: Socket) => {
    const socket = raw as AuthedSocket;
    socket.join(`user:${socket.userId}`);
    logger.info({ userId: socket.userId }, 'socket connected');

    socket.on('chat:join', async (channelId: string, ack?: (r: any) => void) => {
      const ok = await chat.canAccessChannel(channelId, socket.userId, socket.roles);
      if (!ok) return ack?.({ ok: false, error: 'forbidden' });
      socket.join(`chat:${channelId}`);
      ack?.({ ok: true });
    });

    socket.on('chat:leave', (channelId: string) => {
      socket.leave(`chat:${channelId}`);
    });

    socket.on('chat:send', async (payload: { channelId: string; body: string; attachmentUrl?: string }, ack?: (r: any) => void) => {
      try {
        const msg = await chat.sendMessage(
          socket.userId, socket.roles, payload.channelId, payload.body, payload.attachmentUrl
        );
        io!.to(`chat:${payload.channelId}`).emit('chat:message', msg);
        ack?.({ ok: true, message: msg });
      } catch (e: any) {
        ack?.({ ok: false, error: e.message });
      }
    });

    socket.on('chat:read', async (messageId: string, ack?: (r: any) => void) => {
      try {
        await chat.markRead(messageId, socket.userId);
        const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
        if (msg) io!.to(`chat:${msg.channelId}`).emit('chat:read', { messageId, userId: socket.userId });
        ack?.({ ok: true });
      } catch (e: any) {
        ack?.({ ok: false, error: e.message });
      }
    });

    socket.on('disconnect', () => {
      logger.info({ userId: socket.userId }, 'socket disconnected');
    });
  });

  return io;
}

export function getIO(): IOServer {
  if (!io) throw new Error('IO not initialized');
  return io;
}

export function notifyUser(userId: string, event: string, data: any) {
  io?.to(`user:${userId}`).emit(event, data);
}
