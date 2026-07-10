import { getRedis } from '../../../config/redis';

const CART_CHANNEL_PREFIX = 'cart:updated:';

export function getCartChannel(userId: string): string {
  return `${CART_CHANNEL_PREFIX}${userId}`;
}

export async function notifyCartUpdated(userId: string, updatedAt: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.publish(getCartChannel(userId), JSON.stringify({ updatedAt }));
  } catch {
    // non-fatal — clients fall back to polling
  }
}
