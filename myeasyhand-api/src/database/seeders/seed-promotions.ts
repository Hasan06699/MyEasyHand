import { connectDatabase, disconnectDatabase } from '../../config/database';
import { disconnectRedis } from '../../config/redis';
import { logger } from '../../common/utils/logger';
import { seedPromotionsStandalone } from './seed-demo-promotions';

async function run(): Promise<void> {
  await connectDatabase();
  logger.info('Seeding demo promotions...');
  await seedPromotionsStandalone();
  logger.info('Promotion seed completed');
  await disconnectDatabase();
  await disconnectRedis();
}

run().catch((err) => {
  logger.error('Promotion seed failed', err);
  process.exit(1);
});
