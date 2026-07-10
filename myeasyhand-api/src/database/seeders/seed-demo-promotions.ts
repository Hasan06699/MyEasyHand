import { Types } from 'mongoose';
import { User } from '../models/user.model';
import { Business } from '../models/business.model';
import { Service } from '../models/service.model';
import { PromotionBanner } from '../models/promotion-banner.model';
import { ServiceRow } from '../models/service-row.model';
import { PromotionEvent } from '../models/promotion-event.model';
import { logger } from '../../common/utils/logger';

type CategoryMap = Map<string, Types.ObjectId>;

const BANNER_WEB =
  'https://placehold.co/1920x600/31c1ca/FFFFFF/webp?text=MyEasyHand+Banner+Web';
const BANNER_MOBILE =
  'https://placehold.co/750x400/31c1ca/FFFFFF/webp?text=MyEasyHand+Banner+Mobile';
const ROW_BG_IMAGE_WEB =
  'https://placehold.co/1920x600/1e88e5/FFFFFF/webp?text=Row+Background+Web';
const ROW_BG_IMAGE_MOBILE =
  'https://placehold.co/750x400/0d47a1/FFFFFF/webp?text=Row+Background+Mobile';

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

async function clearPromotionData() {
  const [events, banners, rows] = await Promise.all([
    PromotionEvent.deleteMany({}),
    PromotionBanner.deleteMany({}),
    ServiceRow.deleteMany({}),
  ]);
  logger.info(
    `Cleared promotion data (${banners.deletedCount} banners, ${rows.deletedCount} service rows, ${events.deletedCount} events)`,
  );
}

async function seedPromotionEvents(
  banners: Array<{ _id: Types.ObjectId; businessId?: Types.ObjectId }>,
  rows: Array<{ _id: Types.ObjectId; businessId?: Types.ObjectId }>,
  businessId: Types.ObjectId,
) {
  const events: Array<Record<string, unknown>> = [];

  for (const banner of banners) {
    for (let i = 0; i < 90; i++) {
      events.push({
        entityType: 'banner',
        entityId: banner._id,
        eventType: 'view',
        businessId: banner.businessId ?? businessId,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }
    for (let i = 0; i < 12 + Math.floor(Math.random() * 10); i++) {
      events.push({
        entityType: 'banner',
        entityId: banner._id,
        eventType: 'click',
        businessId: banner.businessId ?? businessId,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }
  }

  for (const row of rows) {
    for (let i = 0; i < 70; i++) {
      events.push({
        entityType: 'service_row',
        entityId: row._id,
        eventType: 'view',
        businessId: row.businessId ?? businessId,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }
    for (let i = 0; i < 8 + Math.floor(Math.random() * 6); i++) {
      events.push({
        entityType: 'service_row',
        entityId: row._id,
        eventType: 'click',
        businessId: row.businessId ?? businessId,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }
  }

  if (banners[0]) {
    events.push({
      entityType: 'banner',
      entityId: banners[0]._id,
      eventType: 'booking_conversion',
      businessId,
      revenue: 2499,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });
  }

  if (!events.length) return;

  await PromotionEvent.insertMany(events);

  for (const banner of banners) {
    const viewCount = events.filter(
      (e) =>
        e.entityType === 'banner' &&
        e.entityId?.toString() === banner._id.toString() &&
        e.eventType === 'view',
    ).length;
    const clickCount = events.filter(
      (e) =>
        e.entityType === 'banner' &&
        e.entityId?.toString() === banner._id.toString() &&
        e.eventType === 'click',
    ).length;
    await PromotionBanner.updateOne({ _id: banner._id }, { $set: { viewCount, clickCount } });
  }

  for (const row of rows) {
    const viewCount = events.filter(
      (e) =>
        e.entityType === 'service_row' &&
        e.entityId?.toString() === row._id.toString() &&
        e.eventType === 'view',
    ).length;
    const clickCount = events.filter(
      (e) =>
        e.entityType === 'service_row' &&
        e.entityId?.toString() === row._id.toString() &&
        e.eventType === 'click',
    ).length;
    await ServiceRow.updateOne({ _id: row._id }, { $set: { viewCount, clickCount } });
  }

  logger.info(`Seeded ${events.length} promotion analytics events`);
}

export async function seedDemoPromotions(params: {
  adminId: Types.ObjectId;
  ownerId: Types.ObjectId;
  businessId: Types.ObjectId;
  categoryMap: CategoryMap;
}) {
  await clearPromotionData();

  const now = new Date();
  const yearStart = new Date('2026-01-01T00:00:00.000Z');
  const yearEnd = new Date('2027-12-31T23:59:59.000Z');

  const cleaningCategoryId = params.categoryMap.get('cleaning-services');
  const deepCleaningSubId = params.categoryMap.get('deep-cleaning');
  const applianceCategoryId = params.categoryMap.get('appliance-repair');
  const acSubCategoryId = params.categoryMap.get('ac-repair-service');

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
  const sofaCleaning = await Service.findOne({
    slug: 'sofa-cleaning',
    businessId: params.businessId,
    isDeleted: false,
  });
  const kitchenCleaning = await Service.findOne({
    slug: 'kitchen-cleaning',
    businessId: params.businessId,
    isDeleted: false,
  });

  const seededBanners = await PromotionBanner.insertMany([
    {
      name: 'Summer Services Showcase',
      status: 'active',
      startDate: yearStart,
      endDate: yearEnd,
      priorityOrder: 100,
      bannerImageWeb: 'https://placehold.co/1920x600/F59E0B/FFFFFF/webp?text=Summer+Services',
      bannerImageMobile: 'https://placehold.co/750x400/F59E0B/FFFFFF/webp?text=Summer+Services',
      bannerTitle: 'Summer Sale — Up to 25% Off',
      bannerSubtitle: 'Book AC & cleaning services before the heat hits',
      bannerType: 'services',
      textPosition: 'top-left',
      bannerLayoutType: 'standard',
      serviceSourceType: 'featured',
      maxItems: 8,
      platforms: ['mobile_app', 'website'],
      locations: ['home', 'category', 'campaign'],
      customerTargetType: 'all',
      targetCities: ['Indore', 'Bhopal'],
      viewCount: 0,
      clickCount: 0,
      createdBy: params.adminId,
    },
    {
      name: 'Partner Program Link',
      status: 'active',
      startDate: yearStart,
      endDate: yearEnd,
      priorityOrder: 90,
      bannerImageWeb: 'https://placehold.co/1920x600/10B981/FFFFFF/webp?text=Partner+Program',
      bannerImageMobile: 'https://placehold.co/750x400/10B981/FFFFFF/webp?text=Partners',
      bannerTitle: 'Become a MyEasyHand Partner',
      bannerSubtitle: 'Grow your business with our platform',
      bannerType: 'link',
      textPosition: 'center',
      linkUrl: 'https://myeasyhand.in/partners',
      bannerLayoutType: 'standard',
      platforms: ['mobile_app', 'website'],
      locations: ['home', 'search'],
      customerTargetType: 'all',
      viewCount: 0,
      clickCount: 0,
      createdBy: params.adminId,
    },
    {
      name: 'Festival HTML Landing',
      status: 'active',
      startDate: yearStart,
      endDate: yearEnd,
      priorityOrder: 80,
      bannerImageWeb: BANNER_WEB,
      bannerImageMobile: BANNER_MOBILE,
      bannerTitle: 'Festival Mega Sale',
      bannerSubtitle: 'Limited time festive discounts',
      bannerType: 'html',
      textPosition: 'bottom-center',
      htmlContent: `<div style="font-family:Arial,sans-serif;padding:32px;text-align:center;background:linear-gradient(135deg,#fff7ed,#fef3c7)">
  <h1 style="color:#b45309;margin:0 0 12px">Festival Mega Sale</h1>
  <p style="font-size:18px;color:#78350f">Up to 30% off on home services this season</p>
  <ul style="list-style:none;padding:0;margin:24px 0 0;line-height:2;color:#92400e">
    <li>Free inspection on AC services</li>
    <li>Same-day booking available</li>
    <li>Verified professionals only</li>
  </ul>
</div>`,
      bannerLayoutType: 'html_landing',
      platforms: ['website'],
      locations: ['home', 'campaign'],
      customerTargetType: 'all',
      viewCount: 0,
      clickCount: 0,
      createdBy: params.adminId,
    },
    {
      name: 'Deep Cleaning Services',
      status: 'active',
      startDate: yearStart,
      endDate: addMonths(now, 6),
      priorityOrder: 70,
      bannerImageWeb: 'https://placehold.co/1920x600/8B5CF6/FFFFFF/webp?text=Deep+Cleaning',
      bannerImageMobile: 'https://placehold.co/750x400/8B5CF6/FFFFFF/webp?text=Deep+Cleaning',
      bannerTitle: 'Sparkling Home Deep Clean',
      bannerSubtitle: 'Kitchen, bathroom & living areas — starting ₹1,499',
      bannerType: 'services',
      textPosition: 'center-right',
      bannerLayoutType: 'standard',
      serviceSourceType: 'subcategory',
      categoryId: cleaningCategoryId,
      subcategoryId: deepCleaningSubId,
      maxItems: 6,
      platforms: ['mobile_app', 'website', 'owner_dashboard'],
      locations: ['home', 'category', 'service_details'],
      customerTargetType: 'all',
      businessId: params.businessId,
      viewCount: 0,
      clickCount: 0,
      createdBy: params.ownerId,
    },
    {
      name: 'Book on WhatsApp',
      status: 'active',
      startDate: yearStart,
      endDate: yearEnd,
      priorityOrder: 60,
      bannerImageWeb: 'https://placehold.co/1920x600/25D366/FFFFFF/webp?text=Book+on+WhatsApp',
      bannerImageMobile: 'https://placehold.co/750x400/25D366/FFFFFF/webp?text=WhatsApp',
      bannerTitle: 'Book Instantly on WhatsApp',
      bannerSubtitle: 'Chat with us for quick service booking',
      bannerType: 'link',
      textPosition: 'bottom-left',
      linkUrl: 'https://wa.me/919876543210',
      bannerLayoutType: 'standard',
      platforms: ['mobile_app', 'website'],
      locations: ['home', 'service_details'],
      customerTargetType: 'all',
      businessId: params.businessId,
      viewCount: 0,
      clickCount: 0,
      createdBy: params.ownerId,
    },
    {
      name: 'Curated Picks',
      status: 'active',
      startDate: yearStart,
      endDate: yearEnd,
      priorityOrder: 50,
      bannerImageWeb: 'https://placehold.co/1920x600/EC4899/FFFFFF/webp?text=Curated+Picks',
      bannerImageMobile: 'https://placehold.co/750x400/EC4899/FFFFFF/webp?text=Curated',
      bannerTitle: 'Hand-Picked For You',
      bannerSubtitle: 'Top services in your area',
      bannerType: 'services',
      textPosition: 'top-center',
      bannerLayoutType: 'standard',
      serviceSourceType: 'selected_services',
      serviceIds: [acRepair, sofaCleaning, kitchenCleaning, deepCleaning]
        .filter(Boolean)
        .map((s) => s!._id),
      maxItems: 4,
      platforms: ['mobile_app', 'website'],
      locations: ['home', 'search'],
      customerTargetType: 'existing',
      businessId: params.businessId,
      viewCount: 0,
      clickCount: 0,
      createdBy: params.ownerId,
    },
    {
      name: 'Upcoming Campaign (Draft)',
      status: 'draft',
      startDate: addMonths(now, 1),
      endDate: addMonths(now, 4),
      priorityOrder: 10,
      bannerImageWeb: BANNER_WEB,
      bannerImageMobile: BANNER_MOBILE,
      bannerTitle: 'Coming Soon',
      bannerSubtitle: 'New year campaign — not yet published',
      bannerType: 'services',
      textPosition: 'center-left',
      bannerLayoutType: 'standard',
      serviceSourceType: 'new_services',
      maxItems: 6,
      platforms: ['mobile_app'],
      locations: ['home'],
      customerTargetType: 'all',
      viewCount: 0,
      clickCount: 0,
      createdBy: params.adminId,
    },
  ]);

  const rowDocs: Array<Record<string, unknown>> = [
    {
      rowName: 'Popular Services',
      displayOrder: 1,
      status: 'active',
      isActive: true,
      startDate: yearStart,
      endDate: yearEnd,
      rowTitle: 'Popular Services',
      rowSubtitle: 'Most booked services near you',
      serviceSourceType: 'featured',
      maxItems: 8,
      background: {
        type: 'gradient',
        gradientStart: '#31c1ca',
        gradientEnd: '#1e88e5',
        gradientAngle: 135,
      },
      rowMargin: {
        web: { top: 0, bottom: 0, left: 0, right: 0 },
        mobile: { top: 0, bottom: 0, left: 0, right: 0 },
      },
      rowPadding: {
        web: { top: 24, bottom: 24, left: 32, right: 32 },
        mobile: { top: 16, bottom: 16, left: 16, right: 16 },
      },
      platforms: ['mobile_app', 'website'],
      locations: ['home', 'search'],
      customerTargetType: 'all',
      viewCount: 0,
      clickCount: 0,
      createdBy: params.adminId,
    },
    {
      rowName: 'Best Selling Services',
      displayOrder: 2,
      status: 'active',
      isActive: true,
      startDate: yearStart,
      endDate: yearEnd,
      rowTitle: 'Best Selling Services',
      rowSubtitle: 'Trending based on booking volume',
      serviceSourceType: 'best_selling',
      maxItems: 6,
      background: { type: 'none' },
      rowMargin: {
        web: { top: 8, bottom: 8, left: 0, right: 0 },
        mobile: { top: 4, bottom: 4, left: 0, right: 0 },
      },
      rowPadding: {
        web: { top: 20, bottom: 20, left: 24, right: 24 },
        mobile: { top: 12, bottom: 12, left: 12, right: 12 },
      },
      platforms: ['mobile_app', 'website'],
      locations: ['home'],
      customerTargetType: 'all',
      viewCount: 0,
      clickCount: 0,
      createdBy: params.adminId,
    },
    {
      rowName: 'Top Rated Services',
      displayOrder: 3,
      status: 'active',
      isActive: true,
      startDate: yearStart,
      endDate: yearEnd,
      rowTitle: 'Top Rated Services',
      rowSubtitle: 'Highest rated by customers',
      serviceSourceType: 'top_rated',
      maxItems: 6,
      background: {
        type: 'color',
        color: '#f0fdfa',
      },
      rowMargin: {
        web: { top: 12, bottom: 12, left: 12, right: 12 },
        mobile: { top: 8, bottom: 8, left: 8, right: 8 },
      },
      rowPadding: {
        web: { top: 24, bottom: 24, left: 28, right: 28 },
        mobile: { top: 16, bottom: 16, left: 16, right: 16 },
      },
      platforms: ['mobile_app', 'website'],
      locations: ['home', 'service_details'],
      customerTargetType: 'all',
      viewCount: 0,
      clickCount: 0,
      createdBy: params.adminId,
    },
    {
      rowName: 'New Services',
      displayOrder: 4,
      status: 'active',
      isActive: true,
      startDate: yearStart,
      endDate: yearEnd,
      rowTitle: 'Newly Added Services',
      rowSubtitle: 'Recently launched on MyEasyHand',
      serviceSourceType: 'new_services',
      maxItems: 4,
      background: {
        type: 'image',
        imageUrlWeb: ROW_BG_IMAGE_WEB,
        imageUrlMobile: ROW_BG_IMAGE_MOBILE,
      },
      rowMargin: {
        web: { top: 16, bottom: 16, left: 24, right: 24 },
        mobile: { top: 8, bottom: 8, left: 8, right: 8 },
      },
      rowPadding: {
        web: { top: 32, bottom: 32, left: 40, right: 40 },
        mobile: { top: 20, bottom: 20, left: 16, right: 16 },
      },
      platforms: ['mobile_app', 'website'],
      locations: ['home'],
      customerTargetType: 'all',
      businessId: params.businessId,
      viewCount: 0,
      clickCount: 0,
      createdBy: params.ownerId,
    },
    {
      rowName: 'Scheduled Row (Inactive)',
      displayOrder: 99,
      status: 'inactive',
      isActive: false,
      startDate: addMonths(now, 2),
      endDate: addMonths(now, 5),
      rowTitle: 'Coming Soon Collection',
      rowSubtitle: 'Scheduled for a future campaign',
      serviceSourceType: 'featured',
      maxItems: 4,
      background: {
        type: 'gradient',
        gradientStart: '#e0e7ff',
        gradientEnd: '#c7d2fe',
        gradientAngle: 90,
      },
      rowMargin: {
        web: { top: 0, bottom: 0, left: 0, right: 0 },
        mobile: { top: 0, bottom: 0, left: 0, right: 0 },
      },
      rowPadding: {
        web: { top: 16, bottom: 16, left: 16, right: 16 },
        mobile: { top: 12, bottom: 12, left: 12, right: 12 },
      },
      platforms: ['website'],
      locations: ['home'],
      customerTargetType: 'all',
      viewCount: 0,
      clickCount: 0,
      createdBy: params.adminId,
    },
  ];

  if (cleaningCategoryId) {
    rowDocs.splice(1, 0, {
      rowName: 'Top Cleaning Services',
      displayOrder: 2,
      status: 'active',
      isActive: true,
      startDate: yearStart,
      endDate: yearEnd,
      rowTitle: 'Top Cleaning Services',
      rowSubtitle: 'Professional cleaning for every corner of your home',
      serviceSourceType: 'category',
      categoryId: cleaningCategoryId,
      maxItems: 6,
      background: {
        type: 'color',
        color: '#ede9fe',
      },
      rowMargin: {
        web: { top: 10, bottom: 10, left: 16, right: 16 },
        mobile: { top: 6, bottom: 6, left: 8, right: 8 },
      },
      rowPadding: {
        web: { top: 20, bottom: 20, left: 24, right: 24 },
        mobile: { top: 14, bottom: 14, left: 14, right: 14 },
      },
      platforms: ['mobile_app', 'website'],
      locations: ['home', 'category'],
      customerTargetType: 'all',
      businessId: params.businessId,
      viewCount: 0,
      clickCount: 0,
      createdBy: params.ownerId,
    });
  }

  if (acSubCategoryId) {
    rowDocs.push({
      rowName: 'AC Services',
      displayOrder: 5,
      status: 'active',
      isActive: true,
      startDate: yearStart,
      endDate: yearEnd,
      rowTitle: 'AC Services',
      rowSubtitle: 'Repair, installation & gas refill',
      serviceSourceType: 'subcategory',
      categoryId: applianceCategoryId,
      subcategoryId: acSubCategoryId,
      maxItems: 5,
      background: {
        type: 'video',
        videoSource: 'youtube',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoAutoplay: true,
        videoMuted: true,
      },
      rowMargin: {
        web: { top: 20, bottom: 20, left: 0, right: 0 },
        mobile: { top: 12, bottom: 12, left: 0, right: 0 },
      },
      rowPadding: {
        web: { top: 28, bottom: 28, left: 32, right: 32 },
        mobile: { top: 16, bottom: 16, left: 12, right: 12 },
      },
      platforms: ['mobile_app', 'website'],
      locations: ['home', 'category', 'campaign'],
      customerTargetType: 'all',
      viewCount: 0,
      clickCount: 0,
      createdBy: params.adminId,
    });
  }

  const selectedIds = [acRepair, sofaCleaning, kitchenCleaning, deepCleaning]
    .filter(Boolean)
    .map((s) => s!._id);

  if (selectedIds.length >= 2) {
    rowDocs.push({
      rowName: 'Recommended For You',
      displayOrder: 6,
      status: 'active',
      isActive: true,
      startDate: yearStart,
      endDate: yearEnd,
      rowTitle: 'Recommended For You',
      rowSubtitle: 'Hand-picked services based on your area',
      serviceSourceType: 'selected_services',
      serviceIds: selectedIds,
      maxItems: 4,
      background: {
        type: 'image',
        imageUrlWeb: 'https://placehold.co/1920x600/0f766e/FFFFFF/webp?text=Recommended+Web',
        imageUrlMobile: 'https://placehold.co/750x400/115e59/FFFFFF/webp?text=Recommended+Mobile',
      },
      rowMargin: {
        web: { top: 12, bottom: 12, left: 20, right: 20 },
        mobile: { top: 8, bottom: 8, left: 10, right: 10 },
      },
      rowPadding: {
        web: { top: 24, bottom: 24, left: 32, right: 32 },
        mobile: { top: 16, bottom: 16, left: 16, right: 16 },
      },
      platforms: ['mobile_app', 'website'],
      locations: ['home', 'search'],
      customerTargetType: 'existing',
      targetCities: ['Indore', 'Bhopal'],
      businessId: params.businessId,
      viewCount: 0,
      clickCount: 0,
      createdBy: params.ownerId,
    });
  }

  const seededRows = await ServiceRow.insertMany(rowDocs);

  for (const banner of seededBanners) {
    logger.info(`Seeded banner: ${banner.name}`);
  }
  for (const row of seededRows) {
    logger.info(`Seeded service row: ${row.rowName}`);
  }

  await seedPromotionEvents(
    seededBanners.map((banner) => ({
      _id: banner._id as Types.ObjectId,
      businessId: banner.businessId as Types.ObjectId | undefined,
    })),
    seededRows.map((row) => ({
      _id: row._id as Types.ObjectId,
      businessId: row.businessId as Types.ObjectId | undefined,
    })),
    params.businessId,
  );

  logger.info(
    `Demo promotions ready (${seededBanners.length} banners, ${seededRows.length} service rows)`,
  );
}

export async function seedPromotionsStandalone(): Promise<void> {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@myeasyhand.in';
  const admin = await User.findOne({ email: adminEmail, isDeleted: false });
  const owner = await User.findOne({ email: 'owner@myeasyhand.in', isDeleted: false });
  const business = await Business.findOne({ slug: 'myeasyhand-demo', isDeleted: false });

  if (!admin || !owner || !business) {
    throw new Error('Run full seed first (npm run seed) to create admin, owner, and business.');
  }

  const { ServiceCategory } = await import('../models/service-category.model');
  const categories = await ServiceCategory.find({ isDeleted: false });
  const categoryMap = new Map(categories.map((c) => [c.slug, c._id]));

  await seedDemoPromotions({
    adminId: admin._id,
    ownerId: owner._id,
    businessId: business._id,
    categoryMap,
  });
}
