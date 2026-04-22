import { logger } from '../lib/logger';
import { cleanupExpiredVipRoles } from '../modules/vip/vip.service';

export function startCronJobs() {
  // Run every 5 minutes; cheap enough for this scale.
  const run = async () => {
    try {
      const res = await cleanupExpiredVipRoles();
      if (res && res.removed > 0) logger.info({ removed: res.removed }, 'cron: vip cleanup');
    } catch (e) {
      logger.error({ err: e }, 'cron: vip cleanup failed');
    }
  };
  setTimeout(run, 30_000);
  setInterval(run, 5 * 60 * 1000);
}
