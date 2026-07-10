import { Types } from 'mongoose';
import { CategoryRequest } from '../../../database/models/category-request.model';
import { ServiceCategory } from '../../../database/models/service-category.model';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../common/errors/AppError';
import { Request } from 'express';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export class CategoryRequestService {
  private static assertBusinessOwner(req: Request): void {
    if (!req.user?.roles.includes('business_owner') || !req.user.businessId) {
      throw new ForbiddenError('Only business owners can request categories');
    }
  }

  private static assertSuperAdmin(req: Request): void {
    if (!req.user?.roles.includes('super_admin')) {
      throw new ForbiddenError('Only super admin can perform this action');
    }
  }

  static async list(req: Request) {
    const filter: Record<string, unknown> = {};

    if (req.user?.roles.includes('super_admin')) {
      if (req.query.status) filter.status = req.query.status;
    } else if (req.user?.roles.includes('business_owner') && req.user.businessId) {
      filter.businessId = req.user.businessId;
      if (req.query.status) filter.status = req.query.status;
    } else {
      throw new ForbiddenError();
    }

    return CategoryRequest.find(filter)
      .populate('businessId', 'name slug')
      .populate('requestedBy', 'firstName lastName email')
      .populate('parentId', 'name slug')
      .populate('reviewedBy', 'firstName lastName email')
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 });
  }

  static async create(
    req: Request,
    data: {
      name: string;
      description?: string;
      parentId?: string | null;
      icon?: string;
      image?: string;
      sortOrder?: number;
    },
  ) {
    this.assertBusinessOwner(req);

    const slug = slugify(data.name);
    const [existingCategory, pendingRequest] = await Promise.all([
      ServiceCategory.findOne({ slug, isDeleted: false }),
      CategoryRequest.findOne({
        businessId: req.user!.businessId,
        name: data.name,
        status: 'pending',
      }),
    ]);

    if (existingCategory) {
      throw new ConflictError('This category already exists globally');
    }
    if (pendingRequest) {
      throw new ConflictError('You already have a pending request for this category');
    }

    if (data.parentId) {
      const parent = await ServiceCategory.findOne({ _id: data.parentId, isDeleted: false, isActive: true });
      if (!parent) throw new NotFoundError('Parent category not found');
    }

    return CategoryRequest.create({
      businessId: new Types.ObjectId(req.user!.businessId),
      requestedBy: new Types.ObjectId(req.user!.id),
      name: data.name,
      description: data.description,
      parentId: data.parentId ? new Types.ObjectId(data.parentId) : null,
      icon: data.icon,
      image: data.image,
      sortOrder: data.sortOrder ?? 0,
      status: 'pending',
    });
  }

  static async approve(req: Request, id: string, reviewNote?: string) {
    this.assertSuperAdmin(req);

    const request = await CategoryRequest.findById(id);
    if (!request) throw new NotFoundError('Category request not found');
    if (request.status !== 'pending') {
      throw new ConflictError('Only pending requests can be approved');
    }

    const slug = slugify(request.name);
    const existing = await ServiceCategory.findOne({ slug, isDeleted: false });
    if (existing) {
      throw new ConflictError('A live category with this name already exists');
    }

    if (request.parentId) {
      const parent = await ServiceCategory.findOne({ _id: request.parentId, isDeleted: false });
      if (!parent) throw new ValidationError('Parent category no longer exists');
    }

    const category = await ServiceCategory.create({
      name: request.name,
      slug,
      description: request.description,
      parentId: request.parentId ?? null,
      icon: request.icon,
      image: request.image,
      sortOrder: request.sortOrder,
      isActive: true,
    });

    request.status = 'approved';
    request.reviewedBy = new Types.ObjectId(req.user!.id);
    request.reviewedAt = new Date();
    request.reviewNote = reviewNote;
    request.categoryId = category._id;
    await request.save();

    return { request, category };
  }

  static async reject(req: Request, id: string, reviewNote?: string) {
    this.assertSuperAdmin(req);

    const request = await CategoryRequest.findById(id);
    if (!request) throw new NotFoundError('Category request not found');
    if (request.status !== 'pending') {
      throw new ConflictError('Only pending requests can be rejected');
    }

    request.status = 'rejected';
    request.reviewedBy = new Types.ObjectId(req.user!.id);
    request.reviewedAt = new Date();
    request.reviewNote = reviewNote;
    await request.save();

    return request;
  }
}
