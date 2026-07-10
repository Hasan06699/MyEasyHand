import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { CartService } from '../application/cart.service';
import { getCartChannel } from '../application/cart-events.service';
import { getRedis } from '../../../config/redis';
import { sendSuccess } from '../../../common/utils/response';
import { validate } from '../../../middleware/validate.middleware';

const objectId = Joi.string().hex().length(24);

const cartItemSchema = Joi.object({
  serviceId: objectId.required(),
  quantity: Joi.number().integer().min(1).max(99).required(),
  notes: Joi.string().allow('').max(500).optional(),
});

const saveCartSchema = Joi.object({
  items: Joi.array().items(cartItemSchema).max(50).required(),
  scheduledAt: Joi.string().allow('').optional(),
  notes: Joi.string().allow('').max(2000).optional(),
  couponCode: Joi.string().allow('').max(50).optional(),
  cityName: Joi.string().allow('').max(120).optional(),
  areaName: Joi.string().allow('').max(120).optional(),
  clientUpdatedAt: Joi.string().isoDate().optional(),
});

export const cartValidators = {
  save: validate(saveCartSchema),
};

export class CartController {
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const cart = await CartService.getCart(req.user!.id, req.user?.roles);
      sendSuccess(res, cart);
    } catch (error) {
      next(error);
    }
  }

  static async save(req: Request, res: Response, next: NextFunction) {
    try {
      const cart = await CartService.saveCart(req.user!.id, req.user?.roles, req.body);
      sendSuccess(res, cart, 'Cart saved');
    } catch (error) {
      next(error);
    }
  }

  static async clear(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CartService.clearCart(req.user!.id, req.user?.roles);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async events(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const channel = getCartChannel(userId);

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const subscriber = getRedis().duplicate();
      let closed = false;

      const cleanup = async () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        try {
          await subscriber.unsubscribe(channel);
          await subscriber.quit();
        } catch {
          // ignore
        }
      };

      subscriber.on('error', () => {
        void cleanup();
        res.end();
      });

      subscriber.on('message', (_ch, message) => {
        res.write(`data: ${message}\n\n`);
      });

      await subscriber.subscribe(channel);
      res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);

      const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
      }, 25000);

      req.on('close', () => {
        void cleanup();
      });
    } catch (error) {
      next(error);
    }
  }
}
