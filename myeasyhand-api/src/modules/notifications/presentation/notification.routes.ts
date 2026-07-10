import { Router } from 'express';
import { NotificationController, notificationValidators } from './notification.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorize, authorizeRoles } from '../../../middleware/rbac.middleware';
import { tenantContext } from '../../../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/unread-count', NotificationController.unreadCount);
router.get('/admin', authorizeRoles('super_admin'), NotificationController.listAdmin);
router.post('/send', authorize('notifications.send'), notificationValidators.send, NotificationController.send);
router.put('/read-all', NotificationController.markAllRead);
router.get('/', NotificationController.list);
router.put('/:id/read', NotificationController.markRead);

export default router;
