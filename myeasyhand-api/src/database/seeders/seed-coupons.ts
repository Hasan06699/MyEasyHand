import { connectDatabase, disconnectDatabase } from '../../config/database';
import { disconnectRedis } from '../../config/redis';
import { logger } from '../../common/utils/logger';
import { seedCouponsStandalone } from './seed-demo-coupons';

async function run(): Promise<void> {
  await connectDatabase();
  logger.info('Seeding demo coupons...');
  await seedCouponsStandalone();
  logger.info('Coupon seed completed');
  await disconnectDatabase();
  await disconnectRedis();
}

run().catch((err) => {
  logger.error('Coupon seed failed', err);
  process.exit(1);
});
