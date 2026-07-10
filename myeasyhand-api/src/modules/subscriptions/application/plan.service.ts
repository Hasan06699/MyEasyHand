import { Types, FilterQuery } from 'mongoose';
import { Plan, IPlan } from '../../../database/models/plan.model';
import { ConflictError, NotFoundError } from '../../../common/errors/AppError';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export class PlanService {
  static async listPublic() {
    return Plan.find({ isDeleted: false, isActive: true })
      .sort({ sortOrder: 1, price: 1 });
  }

  static async listAdmin(page = 1, limit = 20) {
    const filter: FilterQuery<IPlan> = { isDeleted: false };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Plan.find(filter).skip(skip).limit(limit).sort({ sortOrder: 1, createdAt: -1 }),
      Plan.countDocuments(filter),
    ]);
    return { items, meta: { page, limit, total } };
  }

  static async getById(id: string) {
    const plan = await Plan.findOne({ _id: id, isDeleted: false });
    if (!plan) throw new NotFoundError('Plan not found');
    return plan;
  }

  static async create(data: {
    name: string;
    description?: string;
    price: number;
    billingCycle?: IPlan['billingCycle'];
    durationDays: number;
    limits: IPlan['limits'];
    features?: string[];
    isActive?: boolean;
    sortOrder?: number;
  }) {
    const slug = slugify(data.name);
    const existing = await Plan.findOne({ slug, isDeleted: false });
    if (existing) throw new ConflictError('Plan slug already exists');

    return Plan.create({ ...data, slug });
  }

  static async update(id: string, data: Partial<IPlan>) {
    await this.getById(id);

    if (data.name) {
      const slug = slugify(data.name);
      const existing = await Plan.findOne({ slug, _id: { $ne: id }, isDeleted: false });
      if (existing) throw new ConflictError('Plan slug already exists');
      data.slug = slug;
    }

    return Plan.findByIdAndUpdate(id, data, { new: true });
  }

  static async remove(id: string) {
    await this.getById(id);
    await Plan.findByIdAndUpdate(id, { isDeleted: true, isActive: false });
    return { message: 'Plan deleted' };
  }
}
