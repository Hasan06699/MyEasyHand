import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'MyEasyHand Service Booking API',
      version: '1.0.0',
      description: 'Enterprise SaaS Service Booking Platform API',
      contact: {
        name: 'MyEasyHand Support',
        email: 'info@myeasyhand.in',
        url: 'https://myeasyhand.in',
      },
    },
    servers: [
      { url: `${config.appUrl}/api/${config.apiVersion}`, description: 'Current' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/docs/swagger.yaml', './src/docs/paths/*.yaml'],
};

export const swaggerSpec = swaggerJsdoc(options);
