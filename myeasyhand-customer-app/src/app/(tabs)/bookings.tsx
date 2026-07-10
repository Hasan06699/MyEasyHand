import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme';
import { BookingCard } from '@/components/booking/BookingCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { bookingApi } from '@/services/api';
import { useAppSelector } from '@/store/hooks';

export default function BookingsScreen() {
  const { theme } = useTheme();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const { data: bookings = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await bookingApi.list({ limit: 50 });
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]}>
        <EmptyState
          title="Sign in to view bookings"
          message="Login to track and manage your service bookings."
          action={<Button label="Login" onPress={() => router.push('/(auth)/login')} />}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) return <LoadingState />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]} edges={['top']}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No bookings yet"
            message="Browse services and book your first appointment."
            action={<Button label="Browse Services" onPress={() => router.push('/(tabs)/services')} />}
          />
        }
        renderItem={({ item }) => (
          <BookingCard booking={item} onPress={() => router.push(`/booking/${item._id}`)} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
});
