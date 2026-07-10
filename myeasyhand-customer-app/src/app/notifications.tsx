import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { notificationApi } from '@/services/api';
import { useAppSelector } from '@/store/hooks';
import { formatDate } from '@/lib/utils';
import type { Notification } from '@/types';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationApi.list({ limit: 50 });
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (!isAuthenticated) {
    return (
      <>
        <Stack.Screen options={{ title: 'Notifications', headerShown: true }} />
        <EmptyState
          title="Sign in required"
          message="Login to view your notifications."
          action={<Button label="Login" onPress={() => router.push('/(auth)/login')} />}
        />
      </>
    );
  }

  if (isLoading) return <LoadingState />;

  const renderItem = ({ item }: { item: Notification }) => (
    <Pressable
      onPress={() => {
        if (!item.isRead) markReadMutation.mutate(item._id);
        const bookingId = item.data?.bookingId as string | undefined;
        if (bookingId) router.push(`/booking/${bookingId}`);
      }}
      style={[
        styles.item,
        {
          backgroundColor: item.isRead ? theme.primary : theme.secondary,
          borderColor: theme.border,
        },
      ]}>
      <Text style={[styles.title, { color: theme.textHighContrast }]}>{item.title}</Text>
      <Text style={[styles.body, { color: theme.textLowContrast }]}>
        {item.body || item.message}
      </Text>
      <Text style={[styles.time, { color: theme.textLowContrast }]}>{formatDate(item.createdAt)}</Text>
    </Pressable>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Notifications', headerShown: true }} />
      <View style={[styles.container, { backgroundColor: theme.primary }]}>
        {notifications.some((n) => !n.isRead) ? (
          <Button
            label="Mark all read"
            variant="ghost"
            onPress={() => markAllMutation.mutate()}
            style={styles.markAll}
          />
        ) : null}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No notifications" message="You're all caught up!" />}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  markAll: { alignSelf: 'flex-end', marginRight: spacing.lg, marginTop: spacing.sm },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  item: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  title: { fontSize: fontSize.md, fontWeight: '700' },
  body: { fontSize: fontSize.sm, marginTop: 4, lineHeight: 20 },
  time: { fontSize: fontSize.xs, marginTop: spacing.sm },
});
