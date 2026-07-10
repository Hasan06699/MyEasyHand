import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, spacing } from '@/theme';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { notificationApi, getApiErrorMessage } from '@/services/api';
import { formatDate } from '@/lib/utils';
import type { Notification } from '@/types';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationApi.list({ limit: 50 });
      return res.data.data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
    onError: (err) => Alert.alert('Error', getApiErrorMessage(err)),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
    onError: (err) => Alert.alert('Error', getApiErrorMessage(err)),
  });

  if (isLoading) return <LoadingState message="Loading notifications..." />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]} edges={['bottom']}>
      {notifications.some((n) => !n.isRead) ? (
        <Pressable
          onPress={() => markAllMutation.mutate()}
          style={[styles.markAll, { borderBottomColor: theme.border }]}>
          <Text style={[styles.markAllText, { color: theme.accent }]}>Mark all as read</Text>
        </Pressable>
      ) : null}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState title="No notifications" message="You're all caught up!" />
        }
        renderItem={({ item }) => (
          <NotificationItem
            item={item}
            theme={theme}
            onPress={() => {
              if (!item.isRead) markReadMutation.mutate(item._id);
            }}
          />
        )}
      />
    </SafeAreaView>
  );
}

function NotificationItem({
  item,
  theme,
  onPress,
}: {
  item: Notification;
  theme: {
    primary: string;
    secondary: string;
    textHighContrast: string;
    textLowContrast: string;
    accent: string;
    border: string;
  };
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.item,
        {
          backgroundColor: item.isRead ? theme.primary : theme.secondary,
          borderBottomColor: theme.border,
        },
      ]}>
      {!item.isRead ? (
        <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />
      ) : null}
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: theme.textHighContrast }]}>{item.title}</Text>
        <Text style={[styles.itemBody, { color: theme.textLowContrast }]}>
          {item.body || item.message}
        </Text>
        <Text style={[styles.itemDate, { color: theme.textLowContrast }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  markAll: {
    padding: spacing.md,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
  },
  markAllText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  list: {
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  itemBody: {
    fontSize: fontSize.sm,
    marginTop: 4,
    lineHeight: 20,
  },
  itemDate: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
