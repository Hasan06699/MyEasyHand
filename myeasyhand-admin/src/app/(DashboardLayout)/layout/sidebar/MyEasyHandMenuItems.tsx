import { uniqueId } from 'lodash';

interface MenuitemsType {
  [x: string]: unknown;
  id?: string;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: string;
  href?: string;
  children?: MenuitemsType[];
  chip?: string;
  chipColor?: string;
  variant?: string;
  external?: boolean;
  roles?: string[];
  requiresSubscription?: boolean;
}

const MyEasyHandMenuItems: MenuitemsType[] = [
  { navlabel: true, subheader: 'MYEASYHAND' },
  { id: uniqueId(), title: 'Dashboard', icon: 'solar:home-2-line-duotone', href: '/', requiresSubscription: true },
  { id: uniqueId(), title: 'Businesses', icon: 'solar:buildings-2-linear', href: '/businesses', roles: ['super_admin'] },
  { id: uniqueId(), title: 'Service Owners', icon: 'solar:user-id-linear', href: '/service-owners', roles: ['super_admin'] },
  { id: uniqueId(), title: 'Categories', icon: 'hugeicons:legal-hammer', href: '/categories', requiresSubscription: true },
  { id: uniqueId(), title: 'Cities', icon: 'solar:map-point-wave-linear', href: '/cities', roles: ['super_admin'] },
  { id: uniqueId(), title: 'Services', icon: 'solar:box-minimalistic-linear', href: '/services', requiresSubscription: true },
  { id: uniqueId(), title: 'Employees', icon: 'solar:users-group-rounded-linear', href: '/employees', roles: ['super_admin', 'business_owner'], requiresSubscription: true },
  { id: uniqueId(), title: 'Customers', icon: 'solar:user-circle-linear', href: '/customers', roles: ['super_admin', 'business_owner'], requiresSubscription: true },
  { id: uniqueId(), title: 'Bookings', icon: 'solar:calendar-linear', href: '/bookings', requiresSubscription: true },
  { id: uniqueId(), title: 'Coupons', icon: 'solar:ticket-sale-linear', href: '/coupons', roles: ['super_admin', 'business_owner', 'employee'], requiresSubscription: true },
  { id: uniqueId(), title: 'Promotions', icon: 'solar:star-fall-minimalistic-2-linear', href: '/promotions', roles: ['super_admin', 'business_owner', 'employee'], requiresSubscription: true },
  { id: uniqueId(), title: 'Payments', icon: 'solar:wallet-linear', href: '/payments', requiresSubscription: true },
  { id: uniqueId(), title: 'Plans', icon: 'solar:tag-price-linear', href: '/plans', roles: ['super_admin'] },
  { id: uniqueId(), title: 'Platform Settings', icon: 'solar:settings-linear', href: '/platform-settings', roles: ['super_admin'] },
  { id: uniqueId(), title: 'Subscriptions', icon: 'solar:card-recive-linear', href: '/subscriptions', roles: ['super_admin', 'business_owner'] },
  { id: uniqueId(), title: 'Notifications', icon: 'solar:notification-unread-lines-linear', href: '/notifications' },
  { id: uniqueId(), title: 'Profile', icon: 'solar:user-circle-linear', href: '/profile' },
];

export default MyEasyHandMenuItems;
