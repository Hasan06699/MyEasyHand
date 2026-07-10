import { config } from '../config';
import { logger } from '../common/utils/logger';
import { DeviceService } from '../modules/auth/application/device.service';

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class OneSignalService {
  /**
   * Send push to ALL devices linked to a user (web, mobile app, multiple browsers).
   * Uses OneSignal external user id (set via SDK login) plus stored subscription ids as fallback.
   */
  static async sendPush(payload: PushPayload): Promise<void> {
    if (!config.onesignal.appId || !config.onesignal.restApiKey) {
      logger.warn('OneSignal not configured, skipping push notification');
      return;
    }

    const body: Record<string, unknown> = {
      app_id: config.onesignal.appId,
      headings: { en: payload.title },
      contents: { en: payload.body },
      data: payload.data,
      // All devices where OneSignal.login(userId) was called (web + mobile)
      include_aliases: { external_id: [payload.userId] },
      target_channel: 'push',
    };

    try {
      const response = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Key ${config.onesignal.restApiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('OneSignal push failed', errorText);

        // Retry with legacy API endpoint if new API rejects the payload
        if (response.status === 400 || response.status === 404) {
          const subscriptionIds = await DeviceService.getActiveSubscriptionIds(payload.userId);
          await this.sendPushLegacy(payload, subscriptionIds);
        }
      }
    } catch (error) {
      logger.error('OneSignal error', error);
    }
  }

  private static async sendPushLegacy(payload: PushPayload, subscriptionIds: string[]): Promise<void> {
    try {
      const body: Record<string, unknown> = {
        app_id: config.onesignal.appId,
        include_external_user_ids: [payload.userId],
        channel_for_external_user_ids: 'push',
        headings: { en: payload.title },
        contents: { en: payload.body },
        data: payload.data,
      };

      if (subscriptionIds.length > 0) {
        body.include_player_ids = subscriptionIds;
      }

      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${config.onesignal.restApiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        logger.error('OneSignal legacy push failed', await response.text());
      }
    } catch (error) {
      logger.error('OneSignal legacy error', error);
    }
  }
}
