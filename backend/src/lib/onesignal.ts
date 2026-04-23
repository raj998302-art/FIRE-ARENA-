import { env } from '../config/env';
import { logger } from './logger';

/**
 * OneSignal REST helper. Safe no-op when keys are absent — we always persist
 * the Notification row; push is just best-effort on top of that.
 */
export function isOneSignalConfigured(): boolean {
  return !!env.ONESIGNAL_APP_ID && !!env.ONESIGNAL_REST_API_KEY;
}

export async function sendPushToUsers(
  externalUserIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isOneSignalConfigured()) return { ok: false, error: 'onesignal_not_configured' };
  if (externalUserIds.length === 0) return { ok: true };
  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${env.ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: env.ONESIGNAL_APP_ID,
        include_external_user_ids: externalUserIds,
        channel_for_external_user_ids: 'push',
        headings: { en: title },
        contents: { en: body },
        data,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.warn({ status: res.status, body: text }, 'OneSignal push failed');
      return { ok: false, error: `status_${res.status}` };
    }
    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: json.id };
  } catch (e) {
    logger.warn({ err: e }, 'OneSignal push error');
    return { ok: false, error: 'network' };
  }
}
