import path from 'path';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './common/errors/errorHandler';
import { globalRateLimiter } from './middleware/rateLimiter.middleware';
import { sanitizeInput } from './middleware/sanitize.middleware';
import { protectSwaggerDocs, protectSwaggerJson, handleSwaggerLogin } from './middleware/swagger-auth.middleware';

export function createApp(): Application {
  const app = express();
  const allowedOrigins = new Set(config.cors.origins);

  app.set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        return callback(null, allowedOrigins.has(origin));
      },
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/uploads', express.static(path.resolve(config.upload.storagePath)));
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(sanitizeInput);
  app.use(globalRateLimiter);

  app.post('/api/docs/login', handleSwaggerLogin);

  app.get('/api/docs/openapi.json', protectSwaggerJson, (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use(
    '/api/docs',
    protectSwaggerDocs,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'MyEasyHand API Docs',
      customJs: '/swagger-init.js',
      swaggerUrl: '/api/docs/openapi.json',
      swaggerOptions: {
        url: '/api/docs/openapi.json',
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        docExpansion: 'none',
      },
    }),
  );

  app.get('/api/docs.json', protectSwaggerJson, (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use(`/api/${config.apiVersion}`, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
