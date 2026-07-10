import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';
import { JobCard } from '@/components/jobs/JobCard';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { bookingApi } from '@/services/api';
import { useAppSelector } from '@/store/hooks';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'employee_assigned', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

export default function JobsScreen() {
  const { theme } = useTheme();
  const user = useAppSelector((s) => s.auth.user);
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data: bookings = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-jobs', filter],
    queryFn: async () => {
      const status = filter === 'all' || filter === 'active' ? undefined : filter;
      const res = await bookingApi.list({ limit: 50, status });
      return res.data.data;
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    if (filter !== 'active') return bookings;
    return bookings.filter(
      (b) => !['completed', 'paid', 'closed', 'cancelled', 'rejected', 'refunded'].includes(b.status),
    );
  }, [bookings, filter]);

  if (isLoading) return <LoadingState message="Loading jobs..." />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]} edges={['top']}>
      <Text style={[styles.title, { color: theme.textHighContrast }]}>My Jobs</Text>

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.accent : theme.secondary,
                },
              ]}>
              <Text
                style={[
                  styles.chipText,
                  { color: active ? theme.primary : theme.textHighContrast },
                ]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No jobs found"
            message="Assigned jobs will appear here when your manager assigns you to bookings."
          />
        }
        renderItem={({ item }) => (
          <JobCard
            booking={item}
            pendingResponse={item.status === 'employee_assigned'}
            onPress={() => router.push(`/job/${item._id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  list: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
});
