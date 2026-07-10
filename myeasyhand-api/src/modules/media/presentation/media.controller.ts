import { Request, Response, NextFunction } from 'express';
import { ImageService } from '../../../services/image.service';
import { sendCreated } from '../../../common/utils/response';
import { ValidationError } from '../../../common/errors/AppError';

export class MediaController {
  static async uploadCategoryImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('Image file is required');
      }

      const relativePath = await ImageService.processCategoryImage(req.file.buffer, req.file.mimetype);
      const url = ImageService.getPublicUrl(relativePath);

      sendCreated(
        res,
        {
          url,
          path: relativePath,
          width: 512,
          height: 512,
          aspectRatio: '1:1',
        },
        'Category image uploaded',
      );
    } catch (e) {
      next(e);
    }
  }

  static async uploadServiceImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('Image file is required');
      }

      const relativePath = await ImageService.processServiceImage(req.file.buffer, req.file.mimetype);
      const url = ImageService.getPublicUrl(relativePath);

      sendCreated(
        res,
        {
          url,
          path: relativePath,
          width: 512,
          height: 512,
          aspectRatio: '1:1',
        },
        'Service image uploaded',
      );
    } catch (e) {
      next(e);
    }
  }

  static async uploadServiceGalleryImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('Image file is required');
      }

      const relativePath = await ImageService.processServiceGalleryImage(req.file.buffer, req.file.mimetype);
      const url = ImageService.getPublicUrl(relativePath);

      sendCreated(
        res,
        {
          url,
          path: relativePath,
          width: 900,
          height: 500,
          aspectRatio: '9:5',
        },
        'Gallery image uploaded',
      );
    } catch (e) {
      next(e);
    }
  }

  static async uploadBusinessDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('Document file is required');
      }

      const relativePath = await ImageService.processDocument(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
      );
      const url = ImageService.getPublicUrl(relativePath);

      sendCreated(
        res,
        {
          url,
          path: relativePath,
          fileName: req.file.originalname,
        },
        'Document uploaded',
      );
    } catch (e) {
      next(e);
    }
  }

  static async uploadPromotionBackgroundImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('Image file is required');
      }

      const relativePath = await ImageService.processPromotionBackgroundImage(
        req.file.buffer,
        req.file.mimetype,
      );
      const url = ImageService.getPublicUrl(relativePath);

      sendCreated(
        res,
        {
          url,
          path: relativePath,
          width: 1920,
          height: 600,
        },
        'Promotion background image uploaded',
      );
    } catch (e) {
      next(e);
    }
  }

  static async uploadPromotionBackgroundVideo(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('Video file is required');
      }

      const relativePath = await ImageService.processPromotionBackgroundVideo(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
      );
      const url = ImageService.getPublicUrl(relativePath);

      sendCreated(
        res,
        {
          url,
          path: relativePath,
          fileName: req.file.originalname,
        },
        'Promotion background video uploaded',
      );
    } catch (e) {
      next(e);
    }
  }
}
