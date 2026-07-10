import { Types, FilterQuery } from 'mongoose';
import { City, ICity } from '../../../database/models/city.model';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../../../common/errors/AppError';
import { Request } from 'express';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export type CityInput = {
  name: string;
  state?: string;
  country?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export class CityService {
  private static assertSuperAdmin(req: Request): void {
    if (!req.user?.roles.includes('super_admin')) {
      throw new ForbiddenError('Only super admin can manage cities');
    }
  }

  static async listPublic() {
    return City.find({ isDeleted: false, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select('name slug state country sortOrder')
      .lean();
  }

  static async listAdmin(includeInactive = false) {
    const filter: FilterQuery<ICity> = { isDeleted: false };
    if (!includeInactive) filter.isActive = true;
    return City.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  }

  static async getBySlugOrId(cityParam: string) {
    const filter: FilterQuery<ICity> = {
      isDeleted: false,
      isActive: true,
      $or: [{ slug: cityParam.toLowerCase() }, { name: new RegExp(`^${cityParam}$`, 'i') }],
    };
    if (Types.ObjectId.isValid(cityParam)) {
      filter.$or!.push({ _id: new Types.ObjectId(cityParam) } as never);
    }
    const city = await City.findOne(filter);
    if (!city) throw new NotFoundError('City not found or inactive');
    return city;
  }

  static async create(req: Request, data: CityInput) {
    this.assertSuperAdmin(req);
    const slug = slugify(data.name);
    const exists = await City.findOne({ slug, isDeleted: false });
    if (exists) throw new ConflictError('City already exists');

    return City.create({
      name: data.name.trim(),
      slug,
      state: data.state?.trim(),
      country: data.country?.trim() || 'India',
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    });
  }

  static async update(req: Request, id: string, data: Partial<CityInput>) {
    this.assertSuperAdmin(req);
    const city = await City.findOne({ _id: id, isDeleted: false });
    if (!city) throw new NotFoundError('City not found');

    const updates: Record<string, unknown> = { ...data };
    if (data.name && data.name !== city.name) {
      const slug = slugify(data.name);
      const duplicate = await City.findOne({ slug, _id: { $ne: id }, isDeleted: false });
      if (duplicate) throw new ConflictError('City with this name already exists');
      updates.slug = slug;
      updates.name = data.name.trim();
    }

    return City.findByIdAndUpdate(id, updates, { new: true });
  }

  static async remove(req: Request, id: string) {
    this.assertSuperAdmin(req);
    const city = await City.findOne({ _id: id, isDeleted: false });
    if (!city) throw new NotFoundError('City not found');
    await City.findByIdAndUpdate(id, { isDeleted: true, isActive: false });
    return { message: 'City deleted' };
  }

  /** Resolve city query param (id, slug, or name) to ObjectId for service filters */
  static async resolveCityId(cityParam?: string): Promise<Types.ObjectId | null> {
    if (!cityParam?.trim()) return null;
    try {
      const city = await this.getBySlugOrId(cityParam.trim());
      return city._id as Types.ObjectId;
    } catch {
      throw new ValidationError('Valid city is required. Select a city to browse services.');
    }
  }
}
