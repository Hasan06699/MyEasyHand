import { Types } from 'mongoose';
import { Request } from 'express';
import { ServiceGallery } from '../../../database/models/service-gallery.model';
import { Service } from '../../../database/models/service.model';
import { ImageService } from '../../../services/image.service';
import { ForbiddenError, NotFoundError } from '../../../common/errors/AppError';

export class ServiceGalleryService {
  static async listByService(serviceId: string) {
    return ServiceGallery.find({ serviceId, isDeleted: false }).sort({ sortOrder: 1, createdAt: 1 });
  }

  static async addImage(req: Request, serviceId: string, imagePath: string, sortOrder = 0) {
    const filter: Record<string, unknown> = { _id: serviceId, isDeleted: false };
    if (!req.user?.roles.includes('super_admin') && req.user?.businessId) {
      filter.businessId = req.user.businessId;
    }

    const service = await Service.findOne(filter);
    if (!service) throw new NotFoundError('Service not found');

    return ServiceGallery.create({
      serviceId: service._id,
      businessId: service.businessId,
      imagePath,
      sortOrder,
    });
  }

  static async removeImage(req: Request, galleryId: string) {
    const filter: Record<string, unknown> = { _id: galleryId, isDeleted: false };
    const galleryItem = await ServiceGallery.findOne(filter);
    if (!galleryItem) throw new NotFoundError('Gallery image not found');

    if (!req.user?.roles.includes('super_admin') && req.user?.businessId !== galleryItem.businessId.toString()) {
      throw new ForbiddenError();
    }

    await ImageService.deleteByUrl(galleryItem.imagePath);
    galleryItem.isDeleted = true;
    await galleryItem.save();

    return { message: 'Gallery image removed' };
  }

  static async reorder(req: Request, serviceId: string, items: { id: string; sortOrder: number }[]) {
    const filter: Record<string, unknown> = { _id: serviceId, isDeleted: false };
    if (!req.user?.roles.includes('super_admin') && req.user?.businessId) {
      filter.businessId = req.user.businessId;
    }

    const service = await Service.findOne(filter);
    if (!service) throw new NotFoundError('Service not found');

    await Promise.all(
      items.map((item) =>
        ServiceGallery.updateOne(
          { _id: new Types.ObjectId(item.id), serviceId: service._id, isDeleted: false },
          { sortOrder: item.sortOrder },
        ),
      ),
    );

    return this.listByService(serviceId);
  }

  static async deleteByService(serviceId: Types.ObjectId) {
    const items = await ServiceGallery.find({ serviceId, isDeleted: false });
    await Promise.all(items.map((item) => ImageService.deleteByUrl(item.imagePath)));
    await ServiceGallery.updateMany({ serviceId }, { isDeleted: true });
  }
}
