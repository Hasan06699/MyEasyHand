'use client';

import { useQuery } from '@tanstack/react-query';
import {
  bookingApi,
  customerApi,
  employeeApi,
  promotionApi,
  couponApi,
  ownerProfileApi,
} from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export function useDashboardData() {
  const { user } = useAuthStore();
  const isSuperAdmin = !!user?.roleSlugs?.includes('super_admin');
  const isBusinessOwner = !!user?.roleSlugs?.includes('business_owner');
  const canViewMarketing = isSuperAdmin || isBusinessOwner;
  const canViewAudience = isSuperAdmin || isBusinessOwner;

  const bookingStatsQuery = useQuery({
    queryKey: ['booking-stats'],
    queryFn: async () => (await bookingApi.stats()).data.data,
  });

  const recentBookingsQuery = useQuery({
    queryKey: ['dashboard-recent-bookings'],
    queryFn: async () => (await bookingApi.list(1)).data.data,
  });

  const pendingBookingsQuery = useQuery({
    queryKey: ['dashboard-pending-bookings'],
    queryFn: async () => (await bookingApi.list(1, 'pending')).data.data,
  });

  const approvalBookingsQuery = useQuery({
    queryKey: ['dashboard-approval-bookings'],
    queryFn: async () => (await bookingApi.list(1, 'awaiting_customer_approval')).data.data,
  });

  const customerStatsQuery = useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => (await customerApi.stats()).data.data,
    enabled: canViewAudience,
  });

  const employeeStatsQuery = useQuery({
    queryKey: ['employee-stats'],
    queryFn: async () => (await employeeApi.stats()).data.data,
    enabled: canViewAudience,
  });

  const promotionStatsQuery = useQuery({
    queryKey: ['promotions', 'stats'],
    queryFn: async () => (await promotionApi.stats()).data.data,
    enabled: canViewMarketing,
  });

  const couponStatsQuery = useQuery({
    queryKey: ['coupon-stats'],
    queryFn: async () => (await couponApi.stats()).data.data,
    enabled: canViewMarketing,
  });

  const earningsQuery = useQuery({
    queryKey: ['owner-earnings'],
    queryFn: async () => (await ownerProfileApi.getEarnings()).data.data,
    enabled: isBusinessOwner && !isSuperAdmin,
  });

  const isLoading =
    bookingStatsQuery.isLoading ||
    recentBookingsQuery.isLoading ||
    pendingBookingsQuery.isLoading ||
    approvalBookingsQuery.isLoading;

  return {
    user,
    isSuperAdmin,
    isBusinessOwner,
    canViewMarketing,
    canViewAudience,
    bookingStats: bookingStatsQuery.data,
    recentBookings: recentBookingsQuery.data ?? [],
    pendingBookings: pendingBookingsQuery.data ?? [],
    approvalBookings: approvalBookingsQuery.data ?? [],
    customerStats: customerStatsQuery.data,
    employeeStats: employeeStatsQuery.data,
    promotionStats: promotionStatsQuery.data,
    couponStats: couponStatsQuery.data,
    earnings: earningsQuery.data,
    isLoading,
    isAudienceLoading: customerStatsQuery.isLoading || employeeStatsQuery.isLoading,
    isMarketingLoading: promotionStatsQuery.isLoading || couponStatsQuery.isLoading,
    isEarningsLoading: earningsQuery.isLoading,
  };
}
