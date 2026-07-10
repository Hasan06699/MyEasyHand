import { Types } from 'mongoose';
import { User } from '../models/user.model';
import { Business } from '../models/business.model';
import { Service } from '../models/service.model';
import { Coupon } from '../models/coupon.model';
import { logger } from '../../common/utils/logger';

type CategoryMap = Map<string, Types.ObjectId>;

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

async function upsertCoupon(
  filter: { code: string; businessId?: Types.ObjectId | null },
  data: Record<string, unknown>,
) {
  const query: Record<string, unknown> = {
    code: filter.code.toUpperCase(),
    isDeleted: false,
  };
  if (filter.businessId) {
    query.businessId = filter.businessId;
  } else {
    query.$or = [{ businessId: { $exists: false } }, { businessId: null }];
  }

  const coupon = await Coupon.findOneAndUpdate(
    query,
    { $set: data },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  logger.info(`Seeded coupon: ${coupon.code}`);
  return coupon;
}

export async function seedDemoCoupons(params: {
  adminId: Types.ObjectId;
  ownerId: Types.ObjectId;
  businessId: Types.ObjectId;
  categoryMap: CategoryMap;
  coolairBusinessId?: Types.ObjectId;
}) {
  const now = new Date();
  const yearEnd = new Date('2027-12-31T23:59:59.000Z');
  const yearStart = new Date('2026-01-01T00:00:00.000Z');

  const applianceCategoryId = params.categoryMap.get('appliance-repair');
  const acSubCategoryId = params.categoryMap.get('ac-repair-service');
  const cleaningCategoryId = params.categoryMap.get('cleaning-services');

  const acRepair = await Service.findOne({
    slug: 'ac-repair',
    businessId: params.businessId,
    isDeleted: false,
  });
  const deepCleaning = await Service.findOne({
    slug: 'deep-cleaning',
    businessId: params.businessId,
    isDeleted: false,
  });

  await upsertCoupon(
    { code: 'MYEASYHAND10' },
    {
      name: 'MyEasyHand 10% Off',
      code: 'MYEASYHAND10',
      description: 'Get 10% off on your booking. Maximum discount ₹500.',
      termsAndConditions: 'Valid on all services. Cannot be combined with other offers.',
      couponType: 'percentage',
      discountPercentage: 10,
      maxDiscountAmount: 500,
      validityStartDate: yearStart,
      validityEndDate: yearEnd,
      validityStartTime: '00:00',
      validityEndTime: '23:59',
      status: 'active',
      usageLimitType: 'total',
      totalUsageLimit: 1000,
      perCustomerLimit: 2,
      usageCount: 0,
      minBookingAmount: 500,
      customerEligibility: 'all',
      serviceRestrictionType: 'all',
      vendorRestrictionType: 'all',
      locationRestrictionType: 'all',
      autoApplyMode: 'best',
      createdBy: params.adminId,
    },
  );

  await upsertCoupon(
    { code: 'FIRSTBOOK' },
    {
      name: 'First Booking 20% Off',
      code: 'FIRSTBOOK',
      description: 'New customers get 20% off on their first booking.',
      termsAndConditions: 'One-time use per customer. New customers only.',
      couponType: 'first_booking',
      discountPercentage: 20,
      maxDiscountAmount: 300,
      validityStartDate: yearStart,
      validityEndDate: yearEnd,
      status: 'active',
      usageLimitType: 'per_customer',
      perCustomerLimit: 1,
      usageCount: 0,
      minBookingAmount: 299,
      customerEligibility: 'new',
      serviceRestrictionType: 'all',
      vendorRestrictionType: 'all',
      locationRestrictionType: 'all',
      autoApplyMode: 'manual',
      createdBy: params.adminId,
    },
  );

  await upsertCoupon(
    { code: 'FLAT100', businessId: params.businessId },
    {
      name: 'Flat ₹100 Off',
      code: 'FLAT100',
      description: '₹100 instant discount on bookings above ₹500.',
      couponType: 'fixed_amount',
      discountAmount: 100,
      validityStartDate: yearStart,
      validityEndDate: yearEnd,
      status: 'active',
      usageLimitType: 'unlimited',
      usageCount: 0,
      minBookingAmount: 500,
      customerEligibility: 'all',
      serviceRestrictionType: 'all',
      vendorRestrictionType: 'all',
      locationRestrictionType: 'all',
      autoApplyMode: 'manual',
      businessId: params.businessId,
      createdBy: params.ownerId,
    },
  );

  await upsertCoupon(
    { code: 'SAVE100' },
    {
      name: '₹100 Wallet Cashback',
      code: 'SAVE100',
      description: 'Book for ₹1000 or more and get ₹100 cashback after service completion.',
      termsAndConditions: 'Cashback credited to wallet after successful service completion.',
      couponType: 'cashback',
      discountAmount: 100,
      validityStartDate: yearStart,
      validityEndDate: yearEnd,
      status: 'active',
      usageLimitType: 'per_customer',
      perCustomerLimit: 3,
      usageCount: 0,
      minBookingAmount: 1000,
      customerEligibility: 'all',
      serviceRestrictionType: 'all',
      vendorRestrictionType: 'all',
      locationRestrictionType: 'all',
      autoApplyMode: 'manual',
      createdBy: params.adminId,
    },
  );

  if (applianceCategoryId) {
    await upsertCoupon(
      { code: 'ACSAVE20', businessId: params.businessId },
      {
        name: 'AC Services 20% Off',
        code: 'ACSAVE20',
        description: '20% off on all AC repair and installation services.',
        couponType: 'percentage',
        discountPercentage: 20,
        maxDiscountAmount: 400,
        validityStartDate: yearStart,
        validityEndDate: yearEnd,
        status: 'active',
        usageLimitType: 'total',
        totalUsageLimit: 500,
        usageCount: 0,
        minBookingAmount: 399,
        customerEligibility: 'all',
        serviceRestrictionType: 'categories',
        categoryIds: [applianceCategoryId],
        vendorRestrictionType: 'all',
        locationRestrictionType: 'all',
        autoApplyMode: 'manual',
        businessId: params.businessId,
        createdBy: params.ownerId,
      },
    );
  }

  if (acSubCategoryId) {
    await upsertCoupon(
      { code: 'ACFIX15' },
      {
        name: 'AC Subcategory 15% Off',
        code: 'ACFIX15',
        description: '15% discount on AC subcategory services.',
        couponType: 'percentage',
        discountPercentage: 15,
        maxDiscountAmount: 350,
        validityStartDate: yearStart,
        validityEndDate: yearEnd,
        status: 'active',
        usageLimitType: 'unlimited',
        usageCount: 0,
        customerEligibility: 'all',
        serviceRestrictionType: 'subcategories',
        subcategoryIds: [acSubCategoryId],
        vendorRestrictionType: 'all',
        locationRestrictionType: 'all',
        autoApplyMode: 'manual',
        createdBy: params.adminId,
      },
    );
  }

  if (acRepair) {
    await upsertCoupon(
      { code: 'ACREPAIR50', businessId: params.businessId },
      {
        name: 'AC Repair ₹50 Off',
        code: 'ACREPAIR50',
        description: 'Flat ₹50 off on AC Repair service only.',
        couponType: 'fixed_amount',
        discountAmount: 50,
        validityStartDate: yearStart,
        validityEndDate: yearEnd,
        status: 'active',
        usageLimitType: 'per_customer',
        perCustomerLimit: 2,
        usageCount: 0,
        customerEligibility: 'all',
        serviceRestrictionType: 'services',
        serviceIds: [acRepair._id],
        vendorRestrictionType: 'all',
        locationRestrictionType: 'all',
        autoApplyMode: 'manual',
        businessId: params.businessId,
        createdBy: params.ownerId,
      },
    );
  }

  if (deepCleaning) {
    await upsertCoupon(
      { code: 'FREECLEAN', businessId: params.businessId },
      {
        name: 'Free Deep Cleaning',
        code: 'FREECLEAN',
        description: '100% off on Deep Cleaning service (limited uses).',
        couponType: 'free_service',
        validityStartDate: yearStart,
        validityEndDate: addMonths(now, 3),
        status: 'active',
        usageLimitType: 'total',
        totalUsageLimit: 50,
        usageCount: 0,
        customerEligibility: 'new',
        serviceRestrictionType: 'services',
        serviceIds: [deepCleaning._id],
        vendorRestrictionType: 'all',
        locationRestrictionType: 'all',
        autoApplyMode: 'manual',
        businessId: params.businessId,
        createdBy: params.ownerId,
      },
    );
  }

  await upsertCoupon(
    { code: 'INDORE15' },
    {
      name: 'Indore & Bhopal 15% Off',
      code: 'INDORE15',
      description: '15% off for customers in Indore and Bhopal.',
      couponType: 'percentage',
      discountPercentage: 15,
      maxDiscountAmount: 250,
      validityStartDate: yearStart,
      validityEndDate: yearEnd,
      status: 'active',
      usageLimitType: 'unlimited',
      usageCount: 0,
      customerEligibility: 'all',
      serviceRestrictionType: 'all',
      vendorRestrictionType: 'all',
      locationRestrictionType: 'cities',
      cityNames: ['Indore', 'Bhopal', 'Dubai'],
      autoApplyMode: 'manual',
      createdBy: params.adminId,
    },
  );

  await upsertCoupon(
    { code: 'VIJAYNAGAR10' },
    {
      name: 'Vijay Nagar Area Discount',
      code: 'VIJAYNAGAR10',
      description: '10% off for Vijay Nagar and Palasia areas.',
      couponType: 'percentage',
      discountPercentage: 10,
      maxDiscountAmount: 200,
      validityStartDate: yearStart,
      validityEndDate: yearEnd,
      status: 'active',
      usageLimitType: 'unlimited',
      usageCount: 0,
      customerEligibility: 'all',
      serviceRestrictionType: 'all',
      vendorRestrictionType: 'all',
      locationRestrictionType: 'areas',
      areaNames: ['Vijay Nagar', 'Palasia', 'Scheme 54'],
      autoApplyMode: 'manual',
      createdBy: params.adminId,
    },
  );

  if (params.coolairBusinessId) {
    await upsertCoupon(
      { code: 'COOLAIR10' },
      {
        name: 'CoolAir Experts 10%',
        code: 'COOLAIR10',
        description: '10% off when booking with CoolAir Experts.',
        couponType: 'percentage',
        discountPercentage: 10,
        maxDiscountAmount: 300,
        validityStartDate: yearStart,
        validityEndDate: yearEnd,
        status: 'active',
        usageLimitType: 'unlimited',
        usageCount: 0,
        customerEligibility: 'all',
        serviceRestrictionType: 'all',
        vendorRestrictionType: 'selected',
        businessIds: [params.coolairBusinessId],
        locationRestrictionType: 'all',
        autoApplyMode: 'manual',
        createdBy: params.adminId,
      },
    );
  }

  await upsertCoupon(
    { code: 'WELCOME250' },
    {
      name: 'Welcome ₹250 Off',
      code: 'WELCOME250',
      description: 'Existing customers save ₹250 on bookings above ₹1500.',
      couponType: 'fixed_amount',
      discountAmount: 250,
      validityStartDate: yearStart,
      validityEndDate: yearEnd,
      status: 'active',
      usageLimitType: 'per_customer',
      perCustomerLimit: 1,
      usageCount: 0,
      minBookingAmount: 1500,
      maxBookingAmount: 10000,
      customerEligibility: 'existing',
      serviceRestrictionType: 'all',
      vendorRestrictionType: 'all',
      locationRestrictionType: 'all',
      autoApplyMode: 'manual',
      createdBy: params.adminId,
    },
  );

  await upsertCoupon(
    { code: 'SUMMER25' },
    {
      name: 'Summer Sale (Scheduled)',
      code: 'SUMMER25',
      description: '25% off summer sale — starts next month.',
      couponType: 'percentage',
      discountPercentage: 25,
      maxDiscountAmount: 600,
      validityStartDate: addMonths(now, 1),
      validityEndDate: addMonths(now, 4),
      status: 'scheduled',
      usageLimitType: 'total',
      totalUsageLimit: 200,
      usageCount: 0,
      customerEligibility: 'all',
      serviceRestrictionType: 'all',
      vendorRestrictionType: 'all',
      locationRestrictionType: 'all',
      autoApplyMode: 'manual',
      createdBy: params.adminId,
    },
  );

  await upsertCoupon(
    { code: 'OLDCODE10' },
    {
      name: 'Expired Promo',
      code: 'OLDCODE10',
      description: 'This coupon has expired (for testing).',
      couponType: 'percentage',
      discountPercentage: 10,
      validityStartDate: new Date('2025-01-01'),
      validityEndDate: new Date('2025-06-30'),
      status: 'expired',
      usageLimitType: 'unlimited',
      usageCount: 42,
      customerEligibility: 'all',
      serviceRestrictionType: 'all',
      vendorRestrictionType: 'all',
      locationRestrictionType: 'all',
      autoApplyMode: 'manual',
      createdBy: params.adminId,
    },
  );

  await upsertCoupon(
    { code: 'DRAFT50' },
    {
      name: 'Draft Coupon',
      code: 'DRAFT50',
      description: 'Draft coupon not yet published.',
      couponType: 'fixed_amount',
      discountAmount: 50,
      validityStartDate: yearStart,
      validityEndDate: yearEnd,
      status: 'draft',
      usageLimitType: 'unlimited',
      usageCount: 0,
      customerEligibility: 'all',
      serviceRestrictionType: 'all',
      vendorRestrictionType: 'all',
      locationRestrictionType: 'all',
      autoApplyMode: 'manual',
      createdBy: params.adminId,
    },
  );

  if (cleaningCategoryId) {
    await upsertCoupon(
      { code: 'CLEANING20', businessId: params.businessId },
      {
        name: 'Cleaning 20% Off',
        code: 'CLEANING20',
        description: '20% off all cleaning category services.',
        couponType: 'percentage',
        discountPercentage: 20,
        maxDiscountAmount: 500,
        validityStartDate: yearStart,
        validityEndDate: yearEnd,
        status: 'active',
        usageLimitType: 'unlimited',
        usageCount: 0,
        customerEligibility: 'all',
        serviceRestrictionType: 'categories',
        categoryIds: [cleaningCategoryId],
        vendorRestrictionType: 'all',
        locationRestrictionType: 'all',
        autoApplyMode: 'best',
        businessId: params.businessId,
        createdBy: params.ownerId,
      },
    );
  }

  const count = await Coupon.countDocuments({ isDeleted: false });
  logger.info(`Demo coupons ready (${count} total)`);
}

export async function seedCouponsStandalone(): Promise<void> {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@myeasyhand.in';
  const admin = await User.findOne({ email: adminEmail, isDeleted: false });
  const owner = await User.findOne({ email: 'owner@myeasyhand.in', isDeleted: false });
  const business = await Business.findOne({ slug: 'myeasyhand-demo', isDeleted: false });
  const coolair = await Business.findOne({ slug: 'coolair-experts', isDeleted: false });

  if (!admin || !owner || !business) {
    throw new Error('Run full seed first (npm run seed) to create admin, owner, and business.');
  }

  const { ServiceCategory } = await import('../models/service-category.model');
  const categories = await ServiceCategory.find({ isDeleted: false });
  const categoryMap = new Map(categories.map((c) => [c.slug, c._id]));

  await seedDemoCoupons({
    adminId: admin._id,
    ownerId: owner._id,
    businessId: business._id,
    categoryMap,
    coolairBusinessId: coolair?._id,
  });
}
