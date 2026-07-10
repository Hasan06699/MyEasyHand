import { connectDatabase, disconnectDatabase } from '../../config/database';
import { disconnectRedis } from '../../config/redis';
import { Role } from '../models/role.model';
import { User } from '../models/user.model';
import { Business } from '../models/business.model';
import { Service, DEFAULT_SERVICE_ICON } from '../models/service.model';
import { ServiceCategory } from '../models/service-category.model';
import { Plan } from '../models/plan.model';
import { Subscription } from '../models/subscription.model';
import { Employee } from '../models/employee.model';
import { TokenService } from '../../services/otp.service';
import { logger } from '../../common/utils/logger';
import { seedMyEasyHandCategories } from './seed-categories';
import {
  seedDemoServices,
  seedSecondBusiness,
  seedDemoCustomers,
  seedDemoBookings,
} from './seed-demo-data';
import { seedDemoCoupons } from './seed-demo-coupons';
import { seedDemoPromotions } from './seed-demo-promotions';
import { seedCities } from './seed-cities';

async function migrateLegacyServices(ownerId: typeof User.prototype._id) {
  const legacy = await Service.collection
    .find({ categoryId: { $exists: true }, parentCategoryId: { $exists: false } })
    .toArray();

  for (const doc of legacy) {
    const category = await ServiceCategory.findById(doc.categoryId);
    if (!category) continue;

    const setFields: Record<string, unknown> = {
      shortDescription: doc.shortDescription || doc.description || 'Service description',
      priceType: doc.priceType || 'fixed',
      createdBy: doc.createdBy || ownerId,
      image: doc.image || doc.serviceImage || 'https://placehold.co/512x512',
      icon: doc.icon || doc.serviceIcon || DEFAULT_SERVICE_ICON,
    };

    if (category.parentId) {
      setFields.parentCategoryId = category.parentId;
      setFields.subCategoryId = category._id;
    } else {
      setFields.parentCategoryId = category._id;
    }

    await Service.collection.updateOne(
      { _id: doc._id },
      { $set: setFields, $unset: { categoryId: '', description: '', serviceImage: '', serviceIcon: '', galleryImages: '' } },
    );
  }

  if (legacy.length > 0) {
    logger.info(`Migrated ${legacy.length} legacy service(s) to new schema`);
  }
}

const ROLES = [
  {
    name: 'Super Admin',
    slug: 'super_admin',
    isSystem: true,
    permissions: [
      'users.manage', 'businesses.manage', 'businesses.read', 'businesses.update',
      'services.create', 'services.read', 'services.update',
      'bookings.read', 'bookings.create', 'bookings.update', 'bookings.assign',
      'payments.manage', 'notifications.send', 'notifications.read', 'settings.manage', 'audit_logs.read',
      'plans.manage', 'subscriptions.manage',
      'coupons.manage',
      'promotions.manage',
    ],
  },
  {
    name: 'Business Owner',
    slug: 'business_owner',
    isSystem: true,
    permissions: [
      'users.manage', 'businesses.read', 'businesses.update',
      'services.create', 'services.read', 'services.update',
      'employees.manage', 'bookings.read', 'bookings.update', 'bookings.assign',
      'payments.manage', 'notifications.send', 'notifications.read', 'settings.manage', 'audit_logs.read',
      'subscriptions.read',
      'coupons.manage',
      'promotions.manage',
    ],
  },
  {
    name: 'Employee',
    slug: 'employee',
    isSystem: true,
    permissions: ['services.read', 'bookings.read', 'bookings.update', 'coupons.read', 'promotions.read'],
  },
  {
    name: 'Customer',
    slug: 'customer',
    isSystem: true,
    permissions: ['services.read', 'bookings.create', 'bookings.read', 'payments.create'],
  },
] as const;

async function seed(): Promise<void> {
  await connectDatabase();
  logger.info('Seeding database...');

  for (const role of ROLES) {
    await Role.findOneAndUpdate({ slug: role.slug }, role, { upsert: true });
  }

  const DEFAULT_PLANS = [
    {
      name: 'Starter',
      slug: 'starter',
      description: 'For small businesses getting started',
      price: 999,
      billingCycle: 'monthly' as const,
      durationDays: 30,
      limits: {
        maxEmployees: 3,
        maxServices: 10,
        maxBanners: 2,
        maxServiceRows: 1,
        maxBookingsPerMonth: 100,
      },
      features: [
        'Up to 3 employees',
        'Up to 10 services',
        'Up to 2 banners & 1 service row',
        'Basic booking management',
        'Email support',
      ],
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Professional',
      slug: 'professional',
      description: 'For growing service businesses',
      price: 2499,
      billingCycle: 'monthly' as const,
      durationDays: 30,
      limits: {
        maxEmployees: 15,
        maxServices: 50,
        maxBanners: 10,
        maxServiceRows: 5,
        maxBookingsPerMonth: 500,
      },
      features: [
        'Up to 15 employees',
        'Up to 50 services',
        'Up to 10 banners & 5 service rows',
        'Advanced booking & analytics',
        'Priority support',
      ],
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Unlimited scale for large operations',
      price: 4999,
      billingCycle: 'monthly' as const,
      durationDays: 30,
      limits: {
        maxEmployees: 100,
        maxServices: 500,
        maxBanners: 50,
        maxServiceRows: 50,
        maxBookingsPerMonth: 5000,
      },
      features: [
        'Up to 100 employees',
        'Up to 500 services',
        'Up to 50 banners & 50 service rows',
        'Custom integrations',
        'Dedicated account manager',
      ],
      isActive: true,
      sortOrder: 3,
    },
  ];

  for (const plan of DEFAULT_PLANS) {
    await Plan.findOneAndUpdate({ slug: plan.slug }, plan, { upsert: true });
  }

  const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@myeasyhand.in';
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      email: adminEmail,
      passwordHash: await TokenService.hashPassword(adminPassword),
      firstName: 'Super',
      lastName: 'Admin',
      roleSlugs: ['super_admin'],
      isEmailVerified: true,
      status: 'active',
    });
    logger.info(`Created super admin: ${adminEmail} / ${adminPassword}`);
  }

  let owner = await User.findOne({ email: 'owner@myeasyhand.in' });
  if (!owner) {
    owner = await User.create({
      email: 'owner@myeasyhand.in',
      passwordHash: await TokenService.hashPassword('Owner@123456'),
      firstName: 'Business',
      lastName: 'Owner',
      roleSlugs: ['business_owner'],
      isEmailVerified: true,
      status: 'active',
    });
  }

  let business = await Business.findOne({ slug: 'myeasyhand-demo' });
  if (!business) {
    business = await Business.create({
      name: 'MyEasyHand Demo Services',
      slug: 'myeasyhand-demo',
      email: 'owner@myeasyhand.in',
      phone: '+918818907445',
      status: 'active',
      ownerId: owner._id,
      address: { city: 'Mumbai', country: 'India' },
    });
    owner.businessId = business._id;
    await owner.save();
  }

  const proPlan = await Plan.findOne({ slug: 'professional' });
  if (proPlan && business && !business.subscriptionId) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + proPlan.durationDays);

    const subscription = await Subscription.create({
      businessId: business._id,
      ownerId: owner!._id,
      planId: proPlan._id,
      status: 'active',
      startDate: new Date(),
      expiresAt,
    });

    business.subscriptionId = subscription._id;
    await business.save();
    logger.info('Created demo subscription for MyEasyHand Demo Services');
  }

  const categoryMap = await seedMyEasyHandCategories();
  const deepCleaningId = categoryMap.get('deep-cleaning');
  const cleaningServicesId = categoryMap.get('cleaning-services');

  if (owner) {
    await migrateLegacyServices(owner._id);
  }

  const serviceExists = await Service.findOne({ slug: 'deep-cleaning', businessId: business._id });
  if (!serviceExists && deepCleaningId && cleaningServicesId && owner) {
    await Service.create({
      businessId: business._id,
      parentCategoryId: cleaningServicesId,
      subCategoryId: deepCleaningId,
      name: 'Deep Cleaning',
      slug: 'deep-cleaning',
      serviceCode: 'SVC-DC-001',
      icon: 'solar:broom-linear',
      image: 'https://placehold.co/512x512/webp?text=Deep+Cleaning',
      shortDescription: 'Complete home deep cleaning service for kitchens, bathrooms, and living areas.',
      fullDescription:
        'Our professional deep cleaning service covers every corner of your home including kitchen degreasing, bathroom sanitization, floor scrubbing, and dust removal from hard-to-reach areas.',
      duration: 120,
      durationUnit: 'minute',
      basePrice: 1499,
      priceType: 'fixed',
      gstPercentage: 18,
      isFeatured: true,
      isPopular: true,
      status: 'active',
      displayOrder: 1,
      metaTitle: 'Deep Cleaning Service',
      metaDescription: 'Book professional deep cleaning for your home at affordable prices.',
      createdBy: owner._id,
    });
  } else if (serviceExists && deepCleaningId && cleaningServicesId) {
    serviceExists.parentCategoryId = cleaningServicesId;
    serviceExists.subCategoryId = deepCleaningId;
    if (!serviceExists.shortDescription) {
      serviceExists.shortDescription = serviceExists.get('description') || 'Complete home deep cleaning service';
    }
    if (!serviceExists.image) {
      serviceExists.image = serviceExists.get('serviceImage') || 'https://placehold.co/512x512';
    }
    if (!serviceExists.icon) {
      serviceExists.icon = serviceExists.get('serviceIcon') || DEFAULT_SERVICE_ICON;
    }
    if (!serviceExists.createdBy && owner) serviceExists.createdBy = owner._id;
    await serviceExists.save();
  }

  if (business) {
    const demoEmployees = [
      {
        email: 'technician@myeasyhand.in',
        password: 'Employee@123456',
        firstName: 'Raj',
        lastName: 'Kumar',
        phone: '+919876543210',
        employeeType: 'service_staff' as const,
        designation: 'Senior Technician',
        department: 'Field Operations',
      },
      {
        email: 'office@myeasyhand.in',
        password: 'Employee@123456',
        firstName: 'Priya',
        lastName: 'Sharma',
        phone: '+919876543211',
        employeeType: 'office_staff' as const,
        designation: 'Office Coordinator',
        department: 'Administration',
      },
    ];

    for (const [index, emp] of demoEmployees.entries()) {
      const existing = await User.findOne({ email: emp.email, isDeleted: false });
      if (existing) continue;

      const user = await User.create({
        email: emp.email,
        passwordHash: await TokenService.hashPassword(emp.password),
        firstName: emp.firstName,
        lastName: emp.lastName,
        phone: emp.phone,
        roleSlugs: ['employee'],
        businessId: business._id,
        isEmailVerified: true,
        status: 'active',
      });

      await Employee.create({
        userId: user._id,
        businessId: business._id,
        employeeCode: `EMP-DEMO-${String(index + 1).padStart(4, '0')}`,
        employeeType: emp.employeeType,
        designation: emp.designation,
        department: emp.department,
        hireDate: new Date(),
        status: 'active',
      });

      logger.info(`Created demo employee: ${emp.email} / ${emp.password}`);
    }
  }

  if (business && owner) {
    const serviceMap = await seedDemoServices(business, owner, categoryMap);
    const deepCleaning = serviceMap.get('deep-cleaning') ?? (await Service.findOne({ slug: 'deep-cleaning', businessId: business._id }));
    if (deepCleaning) serviceMap.set('deep-cleaning', deepCleaning);

    const coolair = await seedSecondBusiness(categoryMap);
    const customers = await seedDemoCustomers();
    await seedDemoBookings(business, owner, serviceMap, customers, coolair ?? undefined);

    await seedDemoCoupons({
      adminId: admin!._id,
      ownerId: owner._id,
      businessId: business._id,
      categoryMap,
      coolairBusinessId: coolair?.business._id,
    });

    await seedDemoPromotions({
      adminId: admin!._id,
      ownerId: owner._id,
      businessId: business._id,
      categoryMap,
    });
  }

  await seedCities();

  logger.info('Seed completed successfully');
  await disconnectDatabase();
  await disconnectRedis();
}

seed().catch((err) => {
  logger.error('Seed failed', err);
  process.exit(1);
});
