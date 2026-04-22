import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { initIO } from './sockets/io';
import { startCronJobs } from './jobs/cron';
import { ensureSystemChannels } from './modules/chat/chat.service';

async function main() {
  const app = createApp();
  const server = http.createServer(app);
  initIO(server);

  try {
    await ensureSystemChannels();
  } catch (e) {
    logger.warn({ err: e }, 'could not ensure system channels (db not reachable?)');
  }

  startCronJobs();

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'fire-arena-max backend listening');
  });

  const shutdown = (sig: string) => {
    logger.info({ sig }, 'shutting down');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((e) => {
  logger.error({ err: e }, 'fatal startup error');
  process.exit(1);
});
