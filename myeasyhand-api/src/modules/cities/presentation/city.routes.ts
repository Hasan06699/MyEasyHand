import { Router } from 'express';
import Joi from 'joi';
import { CityController } from './city.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorizeRoles } from '../../../middleware/rbac.middleware';
import { validate } from '../../../middleware/validate.middleware';

const router = Router();

const citySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  state: Joi.string().trim().max(100).allow('', null).optional(),
  country: Joi.string().trim().max(100).optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
});

const updateSchema = citySchema.fork(['name'], (s) => s.optional()).min(1);

/** Public — active cities for customer city picker */
router.get('/', CityController.listPublic);

/** Admin list (includes inactive when requested) */
router.get(
  '/admin',
  authenticate,
  authorizeRoles('super_admin'),
  CityController.listAdmin,
);

router.post(
  '/',
  authenticate,
  authorizeRoles('super_admin'),
  validate(citySchema),
  CityController.create,
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles('super_admin'),
  validate(updateSchema),
  CityController.update,
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles('super_admin'),
  CityController.remove,
);

export default router;
