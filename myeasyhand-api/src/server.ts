import { createApp } from './app';
import { config } from './config';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './common/utils/logger';
import { NsfwModerationService } from './services/nsfw-moderation.service';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();
  await NsfwModerationService.warmup();

  const app = createApp();

  app.listen(config.port, () => {
    logger.info(`${config.appName} running on port ${config.port}`);
    logger.info(`API: http://localhost:${config.port}/api/${config.apiVersion}`);
    logger.info(`Docs: http://localhost:${config.port}/api/docs`);
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
