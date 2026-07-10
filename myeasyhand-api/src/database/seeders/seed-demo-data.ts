import { Types } from 'mongoose';
import { User } from '../models/user.model';
import { Business } from '../models/business.model';
import { Service } from '../models/service.model';
import { Employee } from '../models/employee.model';
import { Booking } from '../models/booking.model';
import { BookingLineItem } from '../models/booking-line-item.model';
import { BookingAssignment } from '../models/booking-assignment.model';
import { BookingStatusHistory } from '../models/booking-status-history.model';
import { Plan } from '../models/plan.model';
import { Subscription } from '../models/subscription.model';
import { TokenService } from '../../services/otp.service';
import { logger } from '../../common/utils/logger';
import { BookingStatus } from '../../modules/bookings/booking.constants';

type CategoryMap = Map<string, Types.ObjectId>;

interface ServiceSeed {
  name: string;
  slug: string;
  serviceCode: string;
  parentCategorySlug: string;
  subCategorySlug: string;
  shortDescription: string;
  basePrice: number;
  salePrice?: number;
  duration: number;
  icon: string;
  isFeatured?: boolean;
  isPopular?: boolean;
  displayOrder: number;
}

const DEMO_SERVICES: ServiceSeed[] = [
  {
    name: 'AC Repair',
    slug: 'ac-repair',
    serviceCode: 'SVC-AC-001',
    parentCategorySlug: 'appliance-repair',
    subCategorySlug: 'ac-repair-service',
    shortDescription: 'Expert AC repair for split, window, and inverter units.',
    basePrice: 499,
    duration: 60,
    icon: 'solar:snowflake-linear',
    isFeatured: true,
    isPopular: true,
    displayOrder: 2,
  },
  {
    name: 'AC Installation',
    slug: 'ac-installation',
    serviceCode: 'SVC-AC-002',
    parentCategorySlug: 'appliance-repair',
    subCategorySlug: 'ac-repair-service',
    shortDescription: 'Professional AC installation with wall bracket and piping.',
    basePrice: 1499,
    duration: 120,
    icon: 'solar:air-conditioning-linear',
    isFeatured: true,
    displayOrder: 3,
  },
  {
    name: 'AC Gas Refill',
    slug: 'ac-gas-refill',
    serviceCode: 'SVC-AC-003',
    parentCategorySlug: 'appliance-repair',
    subCategorySlug: 'ac-repair-service',
    shortDescription: 'R32/R410 gas top-up with leak check and performance test.',
    basePrice: 899,
    duration: 45,
    icon: 'solar:gas-station-linear',
    displayOrder: 4,
  },
  {
    name: 'Pipe Leak Repair',
    slug: 'pipe-leak-repair',
    serviceCode: 'SVC-PL-001',
    parentCategorySlug: 'plumbing-services',
    subCategorySlug: 'pipe-leak-repair',
    shortDescription: 'Fix kitchen, bathroom, and overhead pipe leaks quickly.',
    basePrice: 399,
    duration: 60,
    icon: 'solar:waterdrop-linear',
    isPopular: true,
    displayOrder: 5,
  },
  {
    name: 'Electrician Visit',
    slug: 'electrician-visit',
    serviceCode: 'SVC-EL-001',
    parentCategorySlug: 'electrical-services',
    subCategorySlug: 'electrician',
    shortDescription: 'Wiring, switchboard, MCB, and load issue diagnosis.',
    basePrice: 299,
    duration: 45,
    icon: 'solar:bolt-linear',
    displayOrder: 6,
  },
  {
    name: 'Sofa Cleaning',
    slug: 'sofa-cleaning',
    serviceCode: 'SVC-SC-001',
    parentCategorySlug: 'cleaning-services',
    subCategorySlug: 'sofa-cleaning',
    shortDescription: 'Deep shampoo and vacuum for fabric and leather sofas.',
    basePrice: 799,
    salePrice: 699,
    duration: 90,
    icon: 'solar:sofa-2-linear',
    isPopular: true,
    displayOrder: 7,
  },
  {
    name: 'Refrigerator Repair',
    slug: 'refrigerator-repair',
    serviceCode: 'SVC-RF-001',
    parentCategorySlug: 'appliance-repair',
    subCategorySlug: 'refrigerator-repair',
    shortDescription: 'Cooling, compressor, and thermostat repair for all brands.',
    basePrice: 449,
    duration: 60,
    icon: 'solar:fridge-linear',
    displayOrder: 8,
  },
  {
    name: 'Kitchen Cleaning',
    slug: 'kitchen-cleaning',
    serviceCode: 'SVC-KC-001',
    parentCategorySlug: 'cleaning-services',
    subCategorySlug: 'kitchen-cleaning',
    shortDescription: 'Degreasing of chimney, tiles, sink, and countertops.',
    basePrice: 999,
    duration: 90,
    icon: 'solar:chef-hat-linear',
    displayOrder: 9,
  },
];

const COOLAIR_SERVICES: ServiceSeed[] = [
  {
    name: 'Split AC Service',
    slug: 'split-ac-service',
    serviceCode: 'CA-AC-001',
    parentCategorySlug: 'appliance-repair',
    subCategorySlug: 'ac-repair-service',
    shortDescription: 'Full split AC service with filter wash and coil cleaning.',
    basePrice: 599,
    duration: 75,
    icon: 'solar:snowflake-linear',
    isFeatured: true,
    displayOrder: 1,
  },
  {
    name: 'Plumbing Emergency',
    slug: 'plumbing-emergency',
    serviceCode: 'CA-PL-001',
    parentCategorySlug: 'plumbing-services',
    subCategorySlug: 'pipe-leak-repair',
    shortDescription: 'Same-day emergency plumbing for burst pipes and blockages.',
    basePrice: 549,
    duration: 60,
    icon: 'solar:waterdrop-linear',
    isPopular: true,
    displayOrder: 2,
  },
];

function resolveCategoryIds(
  categoryMap: CategoryMap,
  parentSlug: string,
  subSlug: string,
): { parentCategoryId: Types.ObjectId; subCategoryId: Types.ObjectId } | null {
  const subCategoryId = categoryMap.get(subSlug);
  const parentCategoryId = categoryMap.get(parentSlug);
  if (!subCategoryId || !parentCategoryId) return null;
  return { parentCategoryId, subCategoryId };
}

async function upsertService(
  businessId: Types.ObjectId,
  ownerId: Types.ObjectId,
  categoryMap: CategoryMap,
  seed: ServiceSeed,
): Promise<typeof Service.prototype | null> {
  const cats = resolveCategoryIds(categoryMap, seed.parentCategorySlug, seed.subCategorySlug);
  if (!cats) {
    logger.warn(`Skipping service ${seed.slug}: category not found`);
    return null;
  }

  const existing = await Service.findOne({ slug: seed.slug, businessId });
  if (existing) return existing;

  return Service.create({
    businessId,
    parentCategoryId: cats.parentCategoryId,
    subCategoryId: cats.subCategoryId,
    name: seed.name,
    slug: seed.slug,
    serviceCode: seed.serviceCode,
    icon: seed.icon,
    image: `https://placehold.co/512x512/webp?text=${encodeURIComponent(seed.name)}`,
    shortDescription: seed.shortDescription,
    fullDescription: seed.shortDescription,
    duration: seed.duration,
    durationUnit: 'minute',
    basePrice: seed.basePrice,
    salePrice: seed.salePrice,
    priceType: 'fixed',
    gstPercentage: 18,
    isFeatured: seed.isFeatured ?? false,
    isPopular: seed.isPopular ?? false,
    status: 'active',
    displayOrder: seed.displayOrder,
    createdBy: ownerId,
  });
}

export async function seedDemoServices(
  business: typeof Business.prototype,
  owner: typeof User.prototype,
  categoryMap: CategoryMap,
): Promise<Map<string, typeof Service.prototype>> {
  const serviceMap = new Map<string, typeof Service.prototype>();

  for (const seed of DEMO_SERVICES) {
    const service = await upsertService(business._id, owner._id, categoryMap, seed);
    if (service) {
      serviceMap.set(seed.slug, service);
      logger.info(`Seeded service: ${seed.name}`);
    }
  }

  return serviceMap;
}

export async function seedSecondBusiness(categoryMap: CategoryMap): Promise<{
  business: typeof Business.prototype;
  owner: typeof User.prototype;
  services: Map<string, typeof Service.prototype>;
} | null> {
  let owner = await User.findOne({ email: 'owner2@myeasyhand.in', isDeleted: false });
  if (!owner) {
    owner = await User.create({
      email: 'owner2@myeasyhand.in',
      passwordHash: await TokenService.hashPassword('Owner@123456'),
      firstName: 'CoolAir',
      lastName: 'Owner',
      phone: '+919876543299',
      roleSlugs: ['business_owner'],
      isEmailVerified: true,
      status: 'active',
    });
    logger.info('Created second business owner: owner2@myeasyhand.in / Owner@123456');
  }

  let business = await Business.findOne({ slug: 'coolair-experts', isDeleted: false });
  if (!business) {
    business = await Business.create({
      name: 'CoolAir Experts',
      slug: 'coolair-experts',
      email: 'owner2@myeasyhand.in',
      phone: '+919876543299',
      status: 'active',
      ownerId: owner._id,
      address: { city: 'Pune', country: 'India' },
    });
    owner.businessId = business._id;
    await owner.save();
    logger.info('Created second business: CoolAir Experts');
  }

  const proPlan = await Plan.findOne({ slug: 'professional' });
  if (proPlan && !business.subscriptionId) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + proPlan.durationDays);
    const subscription = await Subscription.create({
      businessId: business._id,
      ownerId: owner._id,
      planId: proPlan._id,
      status: 'active',
      startDate: new Date(),
      expiresAt,
    });
    business.subscriptionId = subscription._id;
    await business.save();
  }

  const services = new Map<string, typeof Service.prototype>();
  for (const seed of COOLAIR_SERVICES) {
    const slug = `coolair-${seed.slug}`;
    const service = await upsertService(
      business._id,
      owner._id,
      categoryMap,
      { ...seed, slug, serviceCode: seed.serviceCode.replace('CA-', 'CA2-') },
    );
    if (service) {
      services.set(seed.slug, service);
      logger.info(`Seeded CoolAir service: ${seed.name}`);
    }
  }

  return { business, owner, services };
}

export async function seedDemoCustomers(): Promise<Map<string, typeof User.prototype>> {
  const customers = new Map<string, typeof User.prototype>();
  const demoCustomers = [
    {
      key: 'customer1',
      email: 'customer@myeasyhand.in',
      password: 'Customer@123456',
      firstName: 'Amit',
      lastName: 'Patel',
      phone: '+919123456789',
    },
    {
      key: 'customer2',
      email: 'customer2@myeasyhand.in',
      password: 'Customer@123456',
      firstName: 'Sneha',
      lastName: 'Verma',
      phone: '+919123456790',
    },
  ];

  for (const c of demoCustomers) {
    let user = await User.findOne({ email: c.email, isDeleted: false });
    if (!user) {
      user = await User.create({
        email: c.email,
        passwordHash: await TokenService.hashPassword(c.password),
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        roleSlugs: ['customer'],
        isEmailVerified: true,
        status: 'active',
      });
      logger.info(`Created demo customer: ${c.email} / ${c.password}`);
    }
    customers.set(c.key, user);
  }

  return customers;
}

function bookingNumber(suffix: string): string {
  return `SHV-DEMO-${suffix}`;
}

async function createBookingWithLineItems(params: {
  bookingNumber: string;
  orderGroupId?: string;
  customerId: Types.ObjectId;
  businessId: Types.ObjectId;
  service: typeof Service.prototype;
  quantity: number;
  status: BookingStatus;
  scheduledAt: Date;
  visitScheduledAt?: Date;
  employeeUserId?: Types.ObjectId;
  paymentStatus?: 'pending' | 'partial_paid' | 'paid';
  paidAmount?: number;
  notes?: string;
  changedBy: Types.ObjectId;
  lineItems?: Array<{ service: typeof Service.prototype; quantity: number; action?: 'original' | 'added' }>;
}) {
  const exists = await Booking.findOne({ bookingNumber: params.bookingNumber });
  if (exists) return exists;

  const unitPrice = params.service.salePrice ?? params.service.basePrice ?? 0;
  const items = params.lineItems ?? [{ service: params.service, quantity: params.quantity, action: 'original' as const }];
  const subtotal = items.reduce((sum, item) => {
    const price = item.service.salePrice ?? item.service.basePrice ?? 0;
    return sum + price * item.quantity;
  }, 0);

  const booking = await Booking.create({
    bookingNumber: params.bookingNumber,
    orderGroupId: params.orderGroupId,
    customerId: params.customerId,
    businessId: params.businessId,
    serviceId: params.service._id,
    employeeId: params.employeeUserId,
    status: params.status,
    scheduledAt: params.scheduledAt,
    visitScheduledAt: params.visitScheduledAt,
    subtotal,
    discountAmount: 0,
    taxAmount: Math.round(subtotal * 0.18),
    totalAmount: subtotal + Math.round(subtotal * 0.18),
    paidAmount: params.paidAmount ?? 0,
    paymentStatus: params.paymentStatus ?? 'pending',
    notes: params.notes,
  });

  for (const item of items) {
    const price = item.service.salePrice ?? item.service.basePrice ?? 0;
    await BookingLineItem.create({
      bookingId: booking._id,
      serviceId: item.service._id,
      serviceName: item.service.name,
      quantity: item.quantity,
      unitPrice: price,
      totalPrice: price * item.quantity,
      action: item.action ?? 'original',
    });
  }

  await BookingStatusHistory.create({
    bookingId: booking._id,
    businessId: params.businessId,
    toStatus: params.status,
    changedBy: params.changedBy,
    notes: 'Seeded demo booking',
  });

  return booking;
}

export async function seedDemoBookings(
  business: typeof Business.prototype,
  owner: typeof User.prototype,
  services: Map<string, typeof Service.prototype>,
  customers: Map<string, typeof User.prototype>,
  coolair?: { business: typeof Business.prototype; services: Map<string, typeof Service.prototype> },
): Promise<void> {
  const customer1 = customers.get('customer1');
  const customer2 = customers.get('customer2');
  if (!customer1 || !customer2) return;

  const deepCleaning = services.get('deep-cleaning') ?? (await Service.findOne({ slug: 'deep-cleaning', businessId: business._id }));
  const acRepair = services.get('ac-repair');
  const pipeLeak = services.get('pipe-leak-repair');
  const electrician = services.get('electrician-visit');
  const sofaCleaning = services.get('sofa-cleaning');
  const fridgeRepair = services.get('refrigerator-repair');
  const acInstall = services.get('ac-installation');

  const technician = await Employee.findOne({
    businessId: business._id,
    employeeType: 'service_staff',
    isDeleted: false,
    status: 'active',
  });

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Pending — deep cleaning
  if (deepCleaning) {
    await createBookingWithLineItems({
      bookingNumber: bookingNumber('1001'),
      customerId: customer1._id,
      businessId: business._id,
      service: deepCleaning,
      quantity: 1,
      status: 'pending',
      scheduledAt: tomorrow,
      notes: '2 BHK apartment, please bring cleaning supplies',
      changedBy: customer1._id,
    });
  }

  // 2. Accepted — AC repair
  if (acRepair) {
    await createBookingWithLineItems({
      bookingNumber: bookingNumber('1002'),
      customerId: customer1._id,
      businessId: business._id,
      service: acRepair,
      quantity: 1,
      status: 'accepted',
      scheduledAt: tomorrow,
      notes: 'LG split AC not cooling',
      changedBy: owner._id,
    });
  }

  // 3. Employee assigned — plumbing (multi-service: pipe + kitchen cleaning)
  const kitchenCleaning = services.get('kitchen-cleaning');
  if (pipeLeak) {
    const booking = await createBookingWithLineItems({
      bookingNumber: bookingNumber('1003'),
      orderGroupId: 'ORD-DEMO-1003',
      customerId: customer2._id,
      businessId: business._id,
      service: pipeLeak,
      quantity: 1,
      status: 'employee_assigned',
      scheduledAt: dayAfter,
      employeeUserId: technician?.userId,
      notes: 'Kitchen sink pipe leaking',
      changedBy: owner._id,
      lineItems: kitchenCleaning
        ? [
            { service: pipeLeak, quantity: 1 },
            { service: kitchenCleaning, quantity: 1 },
          ]
        : undefined,
    });

    if (booking && technician) {
      const existingAssignment = await BookingAssignment.findOne({ bookingId: booking._id, employeeId: technician._id });
      if (!existingAssignment) {
        await BookingAssignment.create({
          bookingId: booking._id,
          employeeId: technician._id,
          userId: technician.userId,
          businessId: business._id,
          assignedBy: owner._id,
          isTeamLeader: true,
          employeeResponse: 'pending',
          status: 'active',
        });
      }
    }
  }

  // 4. Visit scheduled — electrician
  if (electrician) {
    await createBookingWithLineItems({
      bookingNumber: bookingNumber('1004'),
      customerId: customer2._id,
      businessId: business._id,
      service: electrician,
      quantity: 1,
      status: 'visit_scheduled',
      scheduledAt: dayAfter,
      visitScheduledAt: dayAfter,
      employeeUserId: technician?.userId,
      notes: 'MCB tripping frequently',
      changedBy: owner._id,
    });
  }

  // 5. Service in progress — sofa cleaning
  if (sofaCleaning) {
    await createBookingWithLineItems({
      bookingNumber: bookingNumber('1005'),
      customerId: customer1._id,
      businessId: business._id,
      service: sofaCleaning,
      quantity: 2,
      status: 'service_in_progress',
      scheduledAt: now,
      employeeUserId: technician?.userId,
      changedBy: technician?.userId ?? owner._id,
    });
  }

  // 6. Completed + paid — refrigerator repair
  if (fridgeRepair) {
    const unitPrice = fridgeRepair.salePrice ?? fridgeRepair.basePrice ?? 0;
    const subtotal = unitPrice;
    const total = subtotal + Math.round(subtotal * 0.18);
    await createBookingWithLineItems({
      bookingNumber: bookingNumber('1006'),
      customerId: customer2._id,
      businessId: business._id,
      service: fridgeRepair,
      quantity: 1,
      status: 'completed',
      scheduledAt: lastWeek,
      employeeUserId: technician?.userId,
      paymentStatus: 'paid',
      paidAmount: total,
      changedBy: technician?.userId ?? owner._id,
    });
  }

  // 7. Awaiting customer approval — AC install with added gas refill
  const acGasRefill = services.get('ac-gas-refill');
  if (acInstall && acGasRefill) {
    await createBookingWithLineItems({
      bookingNumber: bookingNumber('1007'),
      customerId: customer1._id,
      businessId: business._id,
      service: acInstall,
      quantity: 1,
      status: 'awaiting_customer_approval',
      scheduledAt: dayAfter,
      employeeUserId: technician?.userId,
      changedBy: technician?.userId ?? owner._id,
      lineItems: [
        { service: acInstall, quantity: 1, action: 'original' },
        { service: acGasRefill, quantity: 1, action: 'added' },
      ],
    });
  }

  // 8. Multi-owner order group — MyEasyHand AC + CoolAir plumbing
  if (coolair && acRepair) {
    const orderGroupId = 'ORD-DEMO-MULTI-2001';
    const coolairPlumbing = coolair.services.get('plumbing-emergency');
    const coolairAc = coolair.services.get('split-ac-service');

    if (acRepair) {
      await createBookingWithLineItems({
        bookingNumber: bookingNumber('2001-A'),
        orderGroupId,
        customerId: customer1._id,
        businessId: business._id,
        service: acRepair,
        quantity: 1,
        status: 'pending',
        scheduledAt: tomorrow,
        notes: 'Part of multi-owner checkout',
        changedBy: customer1._id,
      });
    }

    if (coolairPlumbing && coolairAc) {
      await createBookingWithLineItems({
        bookingNumber: bookingNumber('2001-B'),
        orderGroupId,
        customerId: customer1._id,
        businessId: coolair.business._id,
        service: coolairPlumbing,
        quantity: 1,
        status: 'pending',
        scheduledAt: tomorrow,
        notes: 'Part of multi-owner checkout',
        changedBy: customer1._id,
        lineItems: [
          { service: coolairPlumbing, quantity: 1 },
          { service: coolairAc, quantity: 1 },
        ],
      });
    }
  }

  logger.info('Demo bookings seeded');
}
