import { Types } from 'mongoose';
import { CustomerCart, ICustomerCart } from '../../../database/models/customer-cart.model';
import { Service } from '../../../database/models/service.model';
import { ForbiddenError, ValidationError } from '../../../common/errors/AppError';
import { notifyCartUpdated } from './cart-events.service';

const SERVICE_CART_SELECT =
  'name slug image icon shortDescription parentCategoryId subCategoryId mrp salePrice basePrice discountPercent isFeatured status businessId duration durationUnit priceType';

const SERVICE_POPULATE = [
  { path: 'parentCategoryId', select: 'name slug' },
  { path: 'subCategoryId', select: 'name slug' },
  { path: 'businessId', select: 'name slug' },
];

export interface CartPayload {
  items: Array<{ serviceId: string; quantity: number; notes?: string }>;
  scheduledAt?: string;
  notes?: string;
  couponCode?: string;
  cityName?: string;
  areaName?: string;
  clientUpdatedAt?: string;
}

export class CartService {
  private static assertCustomer(roles: string[] | undefined): void {
    if (!roles?.includes('customer')) {
      throw new ForbiddenError('Only customers can sync cart');
    }
  }

  private static async resolveCartItems(items: Array<{ serviceId: Types.ObjectId; quantity: number; notes?: string }>) {
    if (!items.length) return [];

    const serviceIds = items.map((item) => item.serviceId);
    const services = await Service.find({
      _id: { $in: serviceIds },
      isDeleted: false,
      status: 'active',
    })
      .select(SERVICE_CART_SELECT)
      .populate(SERVICE_POPULATE);

    const serviceMap = new Map(services.map((service) => [service._id.toString(), service]));

    return items
      .map((item) => {
        const service = serviceMap.get(item.serviceId.toString());
        if (!service) return null;
        return {
          serviceId: item.serviceId.toString(),
          service: service.toObject(),
          quantity: item.quantity,
          notes: item.notes ?? '',
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  private static formatCartResponse(cart: ICustomerCart, resolvedItems: Awaited<ReturnType<typeof CartService.resolveCartItems>>) {
    const obj = cart.toObject();
    return {
      items: resolvedItems,
      scheduledAt: obj.scheduledAt ?? '',
      notes: obj.notes ?? '',
      couponCode: obj.couponCode ?? '',
      cityName: obj.cityName ?? '',
      areaName: obj.areaName ?? '',
      updatedAt: (cart as ICustomerCart & { updatedAt?: Date }).updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  static async getCart(userId: string, roles?: string[]) {
    this.assertCustomer(roles);

    const cart = await CustomerCart.findOne({ userId: new Types.ObjectId(userId) });
    if (!cart || !cart.items.length) {
      return {
        items: [],
        scheduledAt: '',
        notes: '',
        couponCode: '',
        cityName: '',
        areaName: '',
        updatedAt: null as string | null,
      };
    }

    const resolvedItems = await this.resolveCartItems(cart.items);
    return this.formatCartResponse(cart, resolvedItems);
  }

  static async saveCart(userId: string, roles: string[] | undefined, payload: CartPayload) {
    this.assertCustomer(roles);

    const items = (payload.items ?? []).map((item) => {
      if (!item.serviceId || !Types.ObjectId.isValid(item.serviceId)) {
        throw new ValidationError('Invalid service in cart');
      }
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
        throw new ValidationError('Invalid quantity in cart');
      }
      return {
        serviceId: new Types.ObjectId(item.serviceId),
        quantity,
        notes: item.notes?.trim() || undefined,
      };
    });

    const uniqueServiceIds = [...new Set(items.map((item) => item.serviceId.toString()))];
    if (uniqueServiceIds.length) {
      const activeCount = await Service.countDocuments({
        _id: { $in: uniqueServiceIds.map((id) => new Types.ObjectId(id)) },
        isDeleted: false,
        status: 'active',
      });
      if (activeCount !== uniqueServiceIds.length) {
        throw new ValidationError('One or more services in the cart are no longer available');
      }
    }

    const cart = await CustomerCart.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        userId: new Types.ObjectId(userId),
        items,
        scheduledAt: payload.scheduledAt?.trim() || undefined,
        notes: payload.notes?.trim() || undefined,
        couponCode: payload.couponCode?.trim() || undefined,
        cityName: payload.cityName?.trim() || undefined,
        areaName: payload.areaName?.trim() || undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const resolvedItems = await this.resolveCartItems(cart.items);
    const response = this.formatCartResponse(cart, resolvedItems);
    void notifyCartUpdated(userId, response.updatedAt);
    return response;
  }

  static async clearCart(userId: string, roles?: string[]) {
    this.assertCustomer(roles);
    await CustomerCart.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        items: [],
        scheduledAt: undefined,
        notes: undefined,
        couponCode: undefined,
        cityName: undefined,
        areaName: undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    const updatedAt = new Date().toISOString();
    void notifyCartUpdated(userId, updatedAt);
    return { message: 'Cart cleared' };
  }
}
