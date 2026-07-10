import { Types, FilterQuery } from 'mongoose';
import { Business, IBusiness } from '../../../database/models/business.model';
import { User } from '../../../database/models/user.model';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../common/errors/AppError';
import { Request } from 'express';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export class BusinessService {
  static async listPublic() {
    const items = await Business.find({ isDeleted: false, status: 'active' })
      .select('name slug email phone logo address')
      .sort({ name: 1 });
    return items;
  }

  static async getBySlug(slug: string) {
    const business = await Business.findOne({ slug, isDeleted: false, status: 'active' });
    if (!business) throw new NotFoundError('Business not found');
    return business;
  }

  static async list(req: Request, page = 1, limit = 20) {
    const filter: FilterQuery<IBusiness> = { isDeleted: false };
    if (!req.user?.roles.includes('super_admin') && req.user?.businessId) {
      filter._id = req.user.businessId;
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Business.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Business.countDocuments(filter),
    ]);

    return { items, meta: { page, limit, total } };
  }

  static async getById(id: string, req: Request) {
    const business = await Business.findOne({ _id: id, isDeleted: false });
    if (!business) throw new NotFoundError('Business not found');

    if (!req.user?.roles.includes('super_admin') && req.user?.businessId !== id) {
      throw new ForbiddenError();
    }

    return business;
  }

  static async create(data: {
    name: string;
    email: string;
    phone?: string;
    address?: IBusiness['address'];
  }, ownerId: string) {
    const slug = slugify(data.name);
    const existing = await Business.findOne({ slug });
    if (existing) throw new ConflictError('Business slug already exists');

    const business = await Business.create({
      ...data,
      slug,
      ownerId: new Types.ObjectId(ownerId),
      status: 'active',
    });

    await User.findByIdAndUpdate(ownerId, {
      businessId: business._id,
      $addToSet: { roleSlugs: 'business_owner' },
    });

    return business;
  }

  static async update(id: string, data: Partial<IBusiness>, req: Request) {
    await this.getById(id, req);
    const business = await Business.findByIdAndUpdate(id, data, { new: true });
    return business;
  }

  static async remove(id: string, req: Request) {
    await this.getById(id, req);
    await Business.findByIdAndUpdate(id, { isDeleted: true });
    return { message: 'Business deleted' };
  }
}
