import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, spacing } from '@/theme';
import { JobCard } from '@/components/jobs/JobCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingState } from '@/components/ui/EmptyState';
import { bookingApi, notificationApi } from '@/services/api';
import { useAppSelector } from '@/store/hooks';
import { getUserDisplayName } from '@/lib/utils';
import { APP_NAME } from '@/constants';

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { user, employee } = useAppSelector((s) => s.auth);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: async () => {
      const res = await bookingApi.list({ limit: 50 });
      return res.data.data;
    },
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const res = await notificationApi.unreadCount();
      return res.data.data.count;
    },
    refetchInterval: 60000,
  });

  const activeJobs = bookings.filter((b) =>
    !['completed', 'paid', 'closed', 'cancelled', 'rejected', 'refunded'].includes(b.status),
  );
  const pendingJobs = bookings.filter((b) => b.status === 'employee_assigned');
  const todayJobs = bookings.filter((b) => {
    const date = new Date(b.visitScheduledAt || b.scheduledAt);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  });

  if (isLoading) return <LoadingState message="Loading dashboard..." />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textLowContrast }]}>{APP_NAME}</Text>
            <Text style={[styles.name, { color: theme.textHighContrast }]}>
              Hello, {getUserDisplayName(user?.firstName, user?.lastName)}
            </Text>
            {employee ? (
              <Text style={[styles.role, { color: theme.textLowContrast }]}>
                {employee.designation} · {employee.employeeCode}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => router.push('/notifications')}
            style={[styles.notifBtn, { backgroundColor: theme.secondary }]}>
            <Feather name="bell" size={20} color={theme.textHighContrast} />
            {unreadCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Active Jobs" value={activeJobs.length} color={theme.accent} theme={theme} />
          <StatCard label="Today" value={todayJobs.length} color={theme.success} theme={theme} />
          <StatCard label="Pending" value={pendingJobs.length} color={theme.warning} theme={theme} />
        </View>

        <SectionHeader
          title="Today's Jobs"
          action={
            activeJobs.length > 3 ? (
              <Pressable onPress={() => router.push('/(tabs)/jobs')}>
                <Text style={{ color: theme.accent, fontWeight: '600', fontSize: fontSize.sm }}>
                  View all
                </Text>
              </Pressable>
            ) : null
          }
        />

        {todayJobs.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: theme.secondary }]}>
            <Feather name="calendar" size={28} color={theme.textLowContrast} />
            <Text style={[styles.emptyText, { color: theme.textLowContrast }]}>
              No jobs scheduled for today
            </Text>
          </View>
        ) : (
          todayJobs.slice(0, 3).map((job) => (
            <JobCard
              key={job._id}
              booking={job}
              pendingResponse={job.status === 'employee_assigned'}
              onPress={() => router.push(`/job/${job._id}`)}
            />
          ))
        )}

        {pendingJobs.length > 0 ? (
          <>
            <SectionHeader title="Needs Response" />
            {pendingJobs.slice(0, 2).map((job) => (
              <JobCard
                key={job._id}
                booking={job}
                pendingResponse
                onPress={() => router.push(`/job/${job._id}`)}
              />
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  color,
  theme,
}: {
  label: string;
  value: number;
  color: string;
  theme: { secondary: string; textHighContrast: string; textLowContrast: string };
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.secondary }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textLowContrast }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginTop: 2,
  },
  role: {
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  emptyBox: {
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
