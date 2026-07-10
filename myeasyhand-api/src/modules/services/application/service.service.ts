import { Types, FilterQuery } from 'mongoose';
import { Service, IService, PriceType, DurationUnit, ServiceStatus, DEFAULT_SERVICE_ICON } from '../../../database/models/service.model';
import { DEFAULT_CATEGORY_ICON } from '../../../database/models/service-category.model';
import { ServiceCategory } from '../../../database/models/service-category.model';
import { Business } from '../../../database/models/business.model';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../../../common/errors/AppError';
import { ImageService } from '../../../services/image.service';
import { AuditLogService } from '../../audit/application/audit-log.service';
import { ServiceOwnerSettingsService } from '../../service-owners/application/service-owner-settings.service';
import { PlanLimitService } from '../../subscriptions/application/plan-limit.service';
import { ServiceGalleryService } from './service-gallery.service';
import { CityService } from '../../cities/application/city.service';
import { Request } from 'express';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

type CategoryRecord = {
  _id: Types.ObjectId;
  parentId?: Types.ObjectId | null;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  children?: CategoryRecord[];
};

function buildCategoryTree(categories: CategoryRecord[]): CategoryRecord[] {
  const nodes = new Map<string, CategoryRecord>();
  const roots: CategoryRecord[] = [];

  for (const category of categories) {
    nodes.set(category._id.toString(), { ...category, children: [] });
  }

  for (const category of categories) {
    const node = nodes.get(category._id.toString())!;
    const parentId = category.parentId?.toString();

    if (parentId && nodes.has(parentId)) {
      nodes.get(parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (items: CategoryRecord[]) => {
    items.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    items.forEach((item) => {
      if (item.children?.length) sortNodes(item.children);
    });
  };

  sortNodes(roots);
  return roots;
}

export type ServiceInput = {
  name: string;
  slug?: string;
  parentCategoryId: string;
  subCategoryId?: string | null;
  serviceCode?: string;
  shortDescription: string;
  fullDescription?: string;
  icon?: string;
  image: string;
  basePrice?: number;
  mrp?: number;
  salePrice?: number;
  discountPercent?: number;
  discountExpiresAt?: string;
  priceType: PriceType;
  duration?: number;
  durationUnit?: DurationUnit;
  gstPercentage?: number;
  isFeatured?: boolean;
  isPopular?: boolean;
  status?: ServiceStatus;
  displayOrder?: number;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  businessId?: string;
  cityIds?: string[];
};

const SERVICE_POPULATE = [
  { path: 'parentCategoryId', select: 'name slug' },
  { path: 'subCategoryId', select: 'name slug' },
  { path: 'cityIds', select: 'name slug state' },
  { path: 'createdBy', select: 'firstName lastName email' },
  {
    path: 'businessId',
    select: 'name slug ownerId',
    populate: { path: 'ownerId', select: 'firstName lastName email' },
  },
];

export class ServiceModuleService {
  private static assertSuperAdmin(req: Request): void {
    if (!req.user?.roles.includes('super_admin')) {
      throw new ForbiddenError('Only super admin can manage categories');
    }
  }

  static getBusinessFilter(req: Request): FilterQuery<IService> {
    const filter: FilterQuery<IService> = { isDeleted: false };
    if (!req.user) {
      filter.status = 'active';
    }
    if (req.user && !req.user.roles.includes('super_admin') && req.user.businessId) {
      filter.businessId = req.user.businessId;
    } else if (req.query.businessId) {
      filter.businessId = req.query.businessId as string;
    }
    if (req.query.status) {
      filter.status = req.query.status as ServiceStatus;
    }
    if (req.query.featured === 'true') {
      filter.isFeatured = true;
    }
    if (req.query.popular === 'true') {
      filter.isPopular = true;
    }
    if (req.query.parentCategoryId) {
      filter.parentCategoryId = new Types.ObjectId(req.query.parentCategoryId as string);
    }
    if (req.query.subCategoryId) {
      filter.subCategoryId = new Types.ObjectId(req.query.subCategoryId as string);
    }
    if (req.query.categoryId) {
      const categoryId = new Types.ObjectId(req.query.categoryId as string);
      filter.$or = [{ parentCategoryId: categoryId }, { subCategoryId: categoryId }];
    }
    return filter;
  }

  /** Apply city scope for public catalog (customers must select a city) */
  private static async applyCityFilter(
    req: Request,
    filter: FilterQuery<IService>,
  ): Promise<FilterQuery<IService>> {
    const cityParam = (req.query.city as string | undefined)?.trim();
    const isPublic = !req.user || req.user.roles.includes('customer');
    const forceCity = req.query.requireCity === 'true';

    if (!cityParam) {
      if (isPublic || forceCity) {
        // Public catalog without city → empty (city-first)
        filter._id = { $in: [] };
      }
      return filter;
    }

    const cityId = await CityService.resolveCityId(cityParam);
    if (cityId) {
      filter.cityIds = cityId;
    }
    return filter;
  }

  static async listCategories(req: Request) {
    const filter: Record<string, unknown> = { isDeleted: false };
    const isSuperAdmin = req.user?.roles.includes('super_admin');

    if (!isSuperAdmin || req.query.includeInactive !== 'true') {
      filter.isActive = true;
    }

    const cityParam = (req.query.city as string | undefined)?.trim();
    const isPublic = !req.user || req.user.roles.includes('customer');

    // City-first: only categories that have active services in the selected city
    if (cityParam || isPublic) {
      if (!cityParam && isPublic) {
        return [];
      }
      if (cityParam) {
        const cityId = await CityService.resolveCityId(cityParam);
        const serviceFilter: FilterQuery<IService> = {
          isDeleted: false,
          status: 'active',
          cityIds: cityId!,
        };
        const services = await Service.find(serviceFilter)
          .select('parentCategoryId subCategoryId')
          .lean();
        const categoryIds = new Set<string>();
        for (const s of services) {
          if (s.parentCategoryId) categoryIds.add(s.parentCategoryId.toString());
          if (s.subCategoryId) categoryIds.add(s.subCategoryId.toString());
        }
        if (categoryIds.size === 0) return [];

        // Include parents of subcategories so tree still works
        const found = await ServiceCategory.find({
          _id: { $in: [...categoryIds] },
          isDeleted: false,
          ...(filter.isActive !== undefined ? { isActive: true } : {}),
        })
          .select('_id parentId')
          .lean();
        for (const c of found) {
          if (c.parentId) categoryIds.add(c.parentId.toString());
        }
        filter._id = { $in: [...categoryIds].map((id) => new Types.ObjectId(id)) };
      }
    }

    const categories = await ServiceCategory.find(filter)
      .populate('parentId', 'name slug')
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    if (req.query.tree === 'true') {
      return buildCategoryTree(categories as CategoryRecord[]);
    }

    return categories;
  }

  private static async validateParentCategory(
    parentId: string | null | undefined,
    categoryId?: string,
  ): Promise<void> {
    if (!parentId) return;

    if (categoryId && parentId === categoryId) {
      throw new ValidationError('Category cannot be its own parent');
    }

    const parent = await ServiceCategory.findOne({ _id: parentId, isDeleted: false });
    if (!parent) throw new NotFoundError('Parent category not found');

    if (categoryId) {
      let current: string | null = parentId;
      while (current) {
        if (current === categoryId) {
          throw new ValidationError('Invalid parent: would create circular reference');
        }
        const doc: { parentId?: Types.ObjectId | null } | null = await ServiceCategory.findById(current).select(
          'parentId',
        );
        current = doc?.parentId?.toString() ?? null;
      }
    }
  }

  private static async validateServiceCategories(parentCategoryId: string, subCategoryId?: string | null): Promise<void> {
    const parent = await ServiceCategory.findOne({
      _id: parentCategoryId,
      isDeleted: false,
      isActive: true,
    });
    if (!parent) throw new NotFoundError('Parent category not found or inactive');

    if (!subCategoryId) return;

    const sub = await ServiceCategory.findOne({
      _id: subCategoryId,
      isDeleted: false,
      isActive: true,
    });
    if (!sub) throw new NotFoundError('Sub category not found or inactive');

    const subParentId = sub.parentId?.toString();
    if (subParentId !== parentCategoryId) {
      throw new ValidationError('Sub category must belong to the selected parent category');
    }
  }

  static async getCategoryById(id: string) {
    const category = await ServiceCategory.findOne({ _id: id, isDeleted: false });
    if (!category) throw new NotFoundError('Category not found');

    await category.populate('parentId', 'name slug');
    return category;
  }

  private static normalizeParentId(parentId?: string | null): Types.ObjectId | null | undefined {
    if (parentId === undefined) return undefined;
    if (!parentId) return null;
    return new Types.ObjectId(parentId);
  }

  static async updateCategory(
    req: Request,
    id: string,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      image?: string;
      sortOrder?: number;
      isActive?: boolean;
      parentId?: string | null;
    },
  ) {
    this.assertSuperAdmin(req);

    const category = await this.getCategoryById(id);
    const updates: Record<string, unknown> = { ...data };

    if (data.parentId !== undefined) {
      const parentId = this.normalizeParentId(data.parentId);
      await this.validateParentCategory(parentId?.toString() ?? null, id);
      updates.parentId = parentId;
    }

    if (data.name && data.name !== category.name) {
      updates.slug = slugify(data.name);
      const duplicate = await ServiceCategory.findOne({
        _id: { $ne: id },
        slug: updates.slug,
        isDeleted: false,
      });
      if (duplicate) throw new ConflictError('Category with this name already exists');
    }

    if (data.image && data.image !== category.image) {
      await ImageService.deleteByUrl(category.image);
    }

    if (data.icon !== undefined && !data.icon) {
      updates.icon = DEFAULT_CATEGORY_ICON;
    }

    return ServiceCategory.findByIdAndUpdate(id, updates, { new: true }).populate('parentId', 'name slug');
  }

  static async deleteCategory(req: Request, id: string) {
    this.assertSuperAdmin(req);

    const category = await this.getCategoryById(id);

    const childCount = await ServiceCategory.countDocuments({ parentId: id, isDeleted: false });
    if (childCount > 0) {
      throw new ConflictError('Cannot delete category with subcategories');
    }

    const serviceCount = await Service.countDocuments({
      isDeleted: false,
      $or: [{ parentCategoryId: id }, { subCategoryId: id }],
    });
    if (serviceCount > 0) {
      throw new ConflictError('Cannot delete category with assigned services');
    }

    await ServiceCategory.findByIdAndUpdate(id, { isDeleted: true });
    await ImageService.deleteByUrl(category.image);
    return { message: 'Category deleted' };
  }

  static async listServices(req: Request, page = 1, limit = 20) {
    let filter = this.getBusinessFilter(req);
    filter = await this.applyCityFilter(req, filter);

    if (req.query.ownerId && req.user?.roles.includes('super_admin')) {
      const businesses = await Business.find({
        ownerId: req.query.ownerId as string,
        isDeleted: false,
      }).select('_id');
      const ownerBusinessIds = businesses.map((b) => b._id);
      if (ownerBusinessIds.length === 0) {
        return { items: [], meta: { page, limit, total: 0 } };
      }
      if (filter.businessId) {
        const currentId =
          typeof filter.businessId === 'object' && filter.businessId !== null && '$in' in filter.businessId
            ? (filter.businessId as { $in: Types.ObjectId[] }).$in[0]
            : filter.businessId;
        if (!ownerBusinessIds.some((id) => id.toString() === currentId.toString())) {
          return { items: [], meta: { page, limit, total: 0 } };
        }
      } else {
        filter.businessId = { $in: ownerBusinessIds };
      }
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Service.find(filter)
        .populate(SERVICE_POPULATE)
        .skip(skip)
        .limit(limit)
        .sort({ displayOrder: 1, createdAt: -1 }),
      Service.countDocuments(filter),
    ]);

    const enriched = await Promise.all(
      items.map(async (service) => {
        const gallery = await ServiceGalleryService.listByService(service._id.toString());
        return { ...service.toObject(), gallery };
      }),
    );

    return { items: enriched, meta: { page, limit, total } };
  }

  private static async resolveCityIds(cityIds?: string[]): Promise<Types.ObjectId[]> {
    const { City } = await import('../../../database/models/city.model');
    if (!cityIds?.length) {
      const all = await City.find({ isDeleted: false, isActive: true }).select('_id');
      if (!all.length) {
        throw new ValidationError('No active cities. Add cities in Admin → Cities first.');
      }
      return all.map((c) => c._id as Types.ObjectId);
    }
    const unique = [...new Set(cityIds.filter(Boolean))];
    const cities = await City.find({ _id: { $in: unique }, isDeleted: false, isActive: true });
    if (cities.length !== unique.length) {
      throw new ValidationError('One or more selected cities are invalid or inactive');
    }
    return cities.map((c) => c._id as Types.ObjectId);
  }

  private static async resolveBusinessId(req: Request, bodyBusinessId?: string): Promise<string> {
    if (req.user?.businessId) return req.user.businessId;
    if (req.user?.roles.includes('super_admin') && bodyBusinessId) return bodyBusinessId;
    const business = await Business.findOne({ status: 'active', isDeleted: false });
    if (!business) throw new NotFoundError('No active business found');
    return business._id.toString();
  }

  private static async assertUniqueSlug(businessId: string, slug: string, excludeId?: string): Promise<void> {
    const filter: FilterQuery<IService> = { businessId, slug, isDeleted: false };
    if (excludeId) filter._id = { $ne: excludeId };
    const existing = await Service.findOne(filter);
    if (existing) throw new ConflictError('Service with this slug already exists');
  }

  private static async assertUniqueServiceCode(serviceCode: string, excludeId?: string): Promise<void> {
    const filter: FilterQuery<IService> = { serviceCode, isDeleted: false };
    if (excludeId) filter._id = { $ne: excludeId };
    const existing = await Service.findOne(filter);
    if (existing) throw new ConflictError('Service code already exists');
  }

  private static async generateServiceCode(excludeId?: string): Promise<string> {
    const existing = await Service.find({
      isDeleted: false,
      serviceCode: { $regex: /^SVC-\d{5}$/ },
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .select('serviceCode')
      .lean();

    let maxNum = 0;
    for (const item of existing) {
      const match = item.serviceCode?.match(/^SVC-(\d{5})$/);
      if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
    }

    for (let n = maxNum + 1; n <= 99999; n++) {
      const code = `SVC-${String(n).padStart(5, '0')}`;
      const duplicateFilter: FilterQuery<IService> = { serviceCode: code, isDeleted: false };
      if (excludeId) duplicateFilter._id = { $ne: excludeId };
      const duplicate = await Service.findOne(duplicateFilter);
      if (!duplicate) return code;
    }

    throw new ConflictError('Unable to generate service code');
  }

  private static async resolveServiceCode(
    serviceCode?: string | null,
    excludeId?: string,
  ): Promise<string> {
    const trimmed = serviceCode?.trim();
    if (trimmed) {
      await this.assertUniqueServiceCode(trimmed, excludeId);
      return trimmed;
    }
    return this.generateServiceCode(excludeId);
  }

  static async createService(req: Request, data: ServiceInput) {
    if (!req.user?.id) throw new ForbiddenError('Authentication required');
    if (!data.image) throw new ValidationError('Service image is required');

    const isSuperAdmin = req.user.roles.includes('super_admin');
    if (isSuperAdmin && !data.businessId) {
      throw new ValidationError('Service owner is required');
    }
    const businessId = await this.resolveBusinessId(req, data.businessId);
    await this.validateServiceCategories(data.parentCategoryId, data.subCategoryId);
    await PlanLimitService.assertServiceLimit(businessId);

    const slug = data.slug ? slugify(data.slug) : slugify(data.name);
    await this.assertUniqueSlug(businessId, slug);

    const business = await Business.findById(businessId);
    const ownerId = business?.ownerId?.toString() ?? req.user.id;
    const autoApprove = isSuperAdmin
      ? data.status !== 'pending'
      : await ServiceOwnerSettingsService.isAutoApproveEnabled(ownerId);

    let status: ServiceStatus = 'pending';
    if (isSuperAdmin && data.status) {
      status = data.status;
    } else if (autoApprove) {
      status = 'active';
    }

    const serviceCode = await this.resolveServiceCode(data.serviceCode);
    const cityIds = await this.resolveCityIds(data.cityIds);

    const service = await Service.create({
      businessId: new Types.ObjectId(businessId),
      parentCategoryId: new Types.ObjectId(data.parentCategoryId),
      subCategoryId: data.subCategoryId ? new Types.ObjectId(data.subCategoryId) : undefined,
      name: data.name,
      slug,
      serviceCode,
      shortDescription: data.shortDescription,
      fullDescription: data.fullDescription,
      icon: data.icon || DEFAULT_SERVICE_ICON,
      image: data.image,
      basePrice: data.basePrice ?? data.salePrice,
      mrp: data.mrp,
      salePrice: data.salePrice,
      discountPercent: data.discountPercent,
      discountExpiresAt: data.discountExpiresAt ? new Date(data.discountExpiresAt) : undefined,
      priceType: data.priceType,
      duration: data.duration,
      durationUnit: data.durationUnit,
      gstPercentage: data.gstPercentage,
      isFeatured: isSuperAdmin ? (data.isFeatured ?? false) : false,
      isPopular: isSuperAdmin ? (data.isPopular ?? false) : false,
      status,
      displayOrder: data.displayOrder ?? 0,
      cityIds,
      metaTitle: data.metaTitle,
      metaKeywords: data.metaKeywords,
      metaDescription: data.metaDescription,
      createdBy: new Types.ObjectId(req.user.id),
    });

    if (autoApprove && !isSuperAdmin) {
      await AuditLogService.log({
        req,
        ownerId,
        businessId,
        module: 'service',
        action: 'service_auto_approved',
        resourceId: service._id.toString(),
        approvalStatus: 'active',
        remarks: 'Auto-approved via owner settings',
      });
    }

    const populated = await service.populate(SERVICE_POPULATE);
    return { ...populated.toObject(), gallery: [] };
  }

  static async approveService(req: Request, id: string, remarks?: string) {
    if (!req.user?.roles.includes('super_admin')) {
      throw new ForbiddenError('Only super admin can approve services');
    }

    const service = await Service.findOne({ _id: id, isDeleted: false, status: 'pending' });
    if (!service) throw new NotFoundError('Pending service not found');

    service.status = 'active';
    await service.save();

    const business = await Business.findById(service.businessId);
    await AuditLogService.log({
      req,
      adminId: req.user.id,
      ownerId: business?.ownerId?.toString(),
      businessId: service.businessId.toString(),
      module: 'service',
      action: 'service_approved',
      resourceId: service._id.toString(),
      approvalStatus: 'active',
      remarks,
    });

    return service.populate(SERVICE_POPULATE);
  }

  static async updateService(req: Request, id: string, data: Partial<ServiceInput>) {
    const filter = this.getBusinessFilter(req);
    const service = await Service.findOne({ _id: id, ...filter });
    if (!service) throw new NotFoundError('Service not found');

    const isSuperAdmin = req.user?.roles.includes('super_admin');
    const updates: Record<string, unknown> = { ...data };

    delete updates.isFeatured;
    delete updates.isPopular;
    if (isSuperAdmin) {
      if (data.isFeatured !== undefined) updates.isFeatured = data.isFeatured;
      if (data.isPopular !== undefined) updates.isPopular = data.isPopular;
    } else {
      if (data.isFeatured === false) updates.isFeatured = false;
      if (data.isPopular === false) updates.isPopular = false;
    }

    if (!isSuperAdmin) {
      delete updates.status;
    }

    if (data.parentCategoryId !== undefined || data.subCategoryId !== undefined) {
      const parentCategoryId = data.parentCategoryId ?? service.parentCategoryId.toString();
      const subCategoryId = data.subCategoryId !== undefined ? data.subCategoryId : service.subCategoryId?.toString();
      await this.validateServiceCategories(parentCategoryId, subCategoryId);
      updates.parentCategoryId = new Types.ObjectId(parentCategoryId);
      updates.subCategoryId = subCategoryId ? new Types.ObjectId(subCategoryId) : null;
    }

    let targetBusinessId = service.businessId.toString();
    if (isSuperAdmin && data.businessId) {
      const business = await Business.findOne({ _id: data.businessId, isDeleted: false });
      if (!business) throw new NotFoundError('Business not found');
      targetBusinessId = data.businessId;
      if (targetBusinessId !== service.businessId.toString()) {
        updates.businessId = new Types.ObjectId(targetBusinessId);
      }
    } else {
      delete updates.businessId;
    }

    if (data.slug) {
      updates.slug = slugify(data.slug);
      await this.assertUniqueSlug(targetBusinessId, updates.slug as string, id);
    } else if (data.name && data.name !== service.name) {
      updates.slug = slugify(data.name);
      await this.assertUniqueSlug(targetBusinessId, updates.slug as string, id);
    }

    if (data.image !== undefined && data.image !== service.image) {
      await ImageService.deleteByUrl(service.image);
    }

    if (data.icon !== undefined && !data.icon) {
      updates.icon = DEFAULT_SERVICE_ICON;
    }

    if (data.cityIds !== undefined) {
      updates.cityIds = await this.resolveCityIds(data.cityIds);
    }

    if (data.serviceCode !== undefined) {
      updates.serviceCode = await this.resolveServiceCode(data.serviceCode, id);
    } else if (!service.serviceCode) {
      updates.serviceCode = await this.generateServiceCode(id);
    }

    const updated = await Service.findByIdAndUpdate(id, updates, { new: true }).populate(SERVICE_POPULATE);
    const gallery = await ServiceGalleryService.listByService(id);
    return { ...updated!.toObject(), gallery };
  }

  static async deleteService(req: Request, id: string) {
    const filter = this.getBusinessFilter(req);
    const service = await Service.findOne({ _id: id, ...filter });
    if (!service) throw new NotFoundError('Service not found');

    await Service.findByIdAndUpdate(id, { isDeleted: true });
    await ImageService.deleteByUrl(service.image);
    await ServiceGalleryService.deleteByService(service._id);

    return { message: 'Service deleted' };
  }

  static async createCategory(
    req: Request,
    data: {
      name: string;
      description?: string;
      icon?: string;
      image?: string;
      sortOrder?: number;
      parentId?: string | null;
    },
  ) {
    this.assertSuperAdmin(req);

    const slug = slugify(data.name);
    const existing = await ServiceCategory.findOne({ slug, isDeleted: false });
    if (existing) throw new ConflictError('Category already exists');

    const parentId = this.normalizeParentId(data.parentId);
    await this.validateParentCategory(parentId?.toString() ?? null);

    return ServiceCategory.create({
      name: data.name,
      description: data.description,
      icon: data.icon || DEFAULT_CATEGORY_ICON,
      image: data.image,
      sortOrder: data.sortOrder ?? 0,
      parentId: parentId ?? null,
      slug,
    });
  }

  static async getById(id: string) {
    const service = await Service.findOne({ _id: id, isDeleted: false }).populate(SERVICE_POPULATE);
    if (!service) throw new NotFoundError('Service not found');
    const gallery = await ServiceGalleryService.listByService(id);
    return { ...service.toObject(), gallery };
  }
}
