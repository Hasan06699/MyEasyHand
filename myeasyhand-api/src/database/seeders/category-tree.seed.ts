export interface CategorySeedNode {
  name: string;
  slug: string;
  sortOrder?: number;
  description?: string;
  children?: CategorySeedNode[];
}

export const MYEASYHAND_CATEGORY_TREE: CategorySeedNode[] = [
  {
    name: 'Home Repair & Maintenance',
    slug: 'home-repair-maintenance',
    sortOrder: 1,
    description: 'Highest priority home repair and maintenance',
    children: [
      {
        name: 'Electrical Services',
        slug: 'electrical-services',
        children: [
          { name: 'Electrician', slug: 'electrician' },
          { name: 'Fan Installation', slug: 'fan-installation' },
          { name: 'Wiring Repair', slug: 'wiring-repair' },
        ],
      },
      {
        name: 'Plumbing Services',
        slug: 'plumbing-services',
        children: [
          { name: 'Pipe Leak Repair', slug: 'pipe-leak-repair' },
          { name: 'Bathroom Fitting', slug: 'bathroom-fitting' },
          { name: 'Water Tank Services', slug: 'water-tank-services' },
        ],
      },
      {
        name: 'Carpenter Services',
        slug: 'carpenter-services',
        children: [
          { name: 'Furniture Repair', slug: 'furniture-repair' },
          { name: 'Door Repair', slug: 'door-repair' },
          { name: 'Modular Furniture Assembly', slug: 'modular-furniture-assembly' },
        ],
      },
    ],
  },
  {
    name: 'Appliance Repair',
    slug: 'appliance-repair',
    sortOrder: 2,
    children: [
      { name: 'AC Repair & Service', slug: 'ac-repair-service' },
      { name: 'Refrigerator Repair', slug: 'refrigerator-repair' },
      { name: 'Washing Machine Repair', slug: 'washing-machine-repair' },
      { name: 'Water Purifier Repair', slug: 'water-purifier-repair' },
      { name: 'TV Repair', slug: 'tv-repair' },
    ],
  },
  {
    name: 'Cleaning Services',
    slug: 'cleaning-services',
    sortOrder: 3,
    children: [
      { name: 'Home Cleaning', slug: 'home-cleaning' },
      { name: 'Deep Cleaning', slug: 'deep-cleaning' },
      { name: 'Sofa Cleaning', slug: 'sofa-cleaning' },
      { name: 'Kitchen Cleaning', slug: 'kitchen-cleaning' },
      { name: 'Bathroom Cleaning', slug: 'bathroom-cleaning' },
    ],
  },
  {
    name: 'Beauty & Salon at Home',
    slug: 'beauty-salon-at-home',
    sortOrder: 4,
    children: [
      { name: 'Hair Cut', slug: 'hair-cut' },
      { name: 'Facial', slug: 'facial' },
      { name: 'Makeup', slug: 'makeup' },
      { name: 'Manicure & Pedicure', slug: 'manicure-pedicure' },
      { name: 'Bridal Makeup', slug: 'bridal-makeup' },
    ],
  },
  {
    name: 'Vehicle Services',
    slug: 'vehicle-services',
    sortOrder: 5,
    children: [
      { name: 'Car Wash', slug: 'car-wash' },
      { name: 'Car Detailing', slug: 'car-detailing' },
      { name: 'Bike Repair', slug: 'bike-repair' },
      { name: 'Driver on Demand', slug: 'driver-on-demand' },
    ],
  },
  {
    name: 'IT & Digital Services',
    slug: 'it-digital-services',
    sortOrder: 6,
    children: [
      { name: 'Website Development', slug: 'website-development' },
      { name: 'Mobile App Development', slug: 'mobile-app-development' },
      { name: 'Graphic Design', slug: 'graphic-design' },
      { name: 'Digital Marketing', slug: 'digital-marketing' },
      { name: 'SEO Services', slug: 'seo-services' },
    ],
  },
  {
    name: 'Property Services',
    slug: 'property-services',
    sortOrder: 7,
    children: [
      { name: 'Property Verification', slug: 'property-verification' },
      { name: 'Home Inspection', slug: 'home-inspection' },
      { name: 'Security Services', slug: 'security-services' },
      { name: 'CCTV Installation', slug: 'cctv-installation' },
    ],
  },
  {
    name: 'Event Services',
    slug: 'event-services',
    sortOrder: 8,
    children: [
      { name: 'Photography', slug: 'photography' },
      { name: 'Videography', slug: 'videography' },
      { name: 'Decoration', slug: 'decoration' },
      { name: 'Catering', slug: 'catering' },
    ],
  },
  {
    name: 'Solar Panel Installation',
    slug: 'solar-panel-installation',
    sortOrder: 9,
    children: [
      { name: 'Rooftop Solar System', slug: 'rooftop-solar-system' },
      { name: 'Solar System Maintenance', slug: 'solar-system-maintenance' },
      { name: 'Solar Panel Cleaning', slug: 'solar-panel-cleaning' },
      { name: 'Solar Inverter Installation', slug: 'solar-inverter-installation' },
      { name: 'Solar Battery Installation', slug: 'solar-battery-installation' },
      { name: 'Site Survey & Consultation', slug: 'site-survey-consultation' },
      { name: 'Subsidy Assistance', slug: 'subsidy-assistance' },
      { name: 'Net Metering Support', slug: 'net-metering-support' },
      { name: 'Solar Repair Services', slug: 'solar-repair-services' },
    ],
  },
];

export const LEGACY_CATEGORY_SLUGS = ['home-services', 'cleaning'];
