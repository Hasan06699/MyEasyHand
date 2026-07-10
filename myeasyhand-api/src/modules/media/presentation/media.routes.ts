import { Router } from 'express';
import { MediaController } from './media.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorizeRoles } from '../../../middleware/rbac.middleware';
import { tenantContext } from '../../../middleware/tenant.middleware';
import { categoryImageUpload, serviceImageUpload, documentUpload, promotionBackgroundImageUpload, promotionBackgroundVideoUpload } from '../../../middleware/upload.middleware';

const router = Router();

const handleUpload =
  (upload: typeof categoryImageUpload) => (req: Parameters<typeof categoryImageUpload>[0], res: Parameters<typeof categoryImageUpload>[1], next: Parameters<typeof categoryImageUpload>[2]) => {
    upload(req, res, (err) => {
      if (err) next(err);
      else next();
    });
  };

router.post(
  '/category-image',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin'),
  handleUpload(categoryImageUpload),
  MediaController.uploadCategoryImage,
);

router.post(
  '/service-image',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin', 'business_owner'),
  handleUpload(serviceImageUpload),
  MediaController.uploadServiceImage,
);

router.post(
  '/service-gallery',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin', 'business_owner'),
  handleUpload(serviceImageUpload),
  MediaController.uploadServiceGalleryImage,
);

router.post(
  '/business-document',
  authenticate,
  tenantContext,
  authorizeRoles('business_owner'),
  handleUpload(documentUpload),
  MediaController.uploadBusinessDocument,
);

router.post(
  '/promotion-background-image',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin', 'business_owner'),
  handleUpload(promotionBackgroundImageUpload),
  MediaController.uploadPromotionBackgroundImage,
);

router.post(
  '/promotion-background-video',
  authenticate,
  tenantContext,
  authorizeRoles('super_admin', 'business_owner'),
  handleUpload(promotionBackgroundVideoUpload),
  MediaController.uploadPromotionBackgroundVideo,
);

export default router;
