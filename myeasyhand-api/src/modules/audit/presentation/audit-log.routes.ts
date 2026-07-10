import { Router } from 'express';
import { AuditLogController } from './audit-log.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorizeRoles } from '../../../middleware/rbac.middleware';
import { tenantContext } from '../../../middleware/tenant.middleware';

const router = Router();

router.get(
  '/',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin', 'business_owner'),
  AuditLogController.list,
);

export default router;
