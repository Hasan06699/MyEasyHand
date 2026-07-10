import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '@/constants';
import { formatDate, formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface JobCardProps {
  booking: Booking;
  onPress?: () => void;
  pendingResponse?: boolean;
}

export function JobCard({ booking, onPress, pendingResponse }: JobCardProps) {
  const { theme } = useTheme();
  const serviceName =
    typeof booking.serviceId === 'object' ? booking.serviceId?.name : 'Service Job';
  const customer =
    typeof booking.customerId === 'object'
      ? [booking.customerId?.firstName, booking.customerId?.lastName].filter(Boolean).join(' ')
      : null;
  const statusColor = BOOKING_STATUS_COLORS[booking.status] || theme.accent;

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: theme.secondary }]}>
      {pendingResponse ? (
        <View style={[styles.alert, { backgroundColor: `${theme.warning}22` }]}>
          <Feather name="alert-circle" size={14} color={theme.warning} />
          <Text style={[styles.alertText, { color: theme.warning }]}>Response required</Text>
        </View>
      ) : null}
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={[styles.number, { color: theme.textLowContrast }]}>{booking.bookingNumber}</Text>
          <Text style={[styles.title, { color: theme.textHighContrast }]}>{serviceName}</Text>
          {customer ? (
            <Text style={[styles.customer, { color: theme.textLowContrast }]}>{customer}</Text>
          ) : null}
        </View>
        <Badge label={BOOKING_STATUS_LABELS[booking.status] || booking.status} color={statusColor} />
      </View>
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Feather name="calendar" size={14} color={theme.textLowContrast} />
          <Text style={[styles.metaText, { color: theme.textLowContrast }]}>
            {formatDate(booking.visitScheduledAt || booking.scheduledAt)}
          </Text>
        </View>
        <Text style={[styles.amount, { color: theme.accent }]}>{formatPrice(booking.totalAmount)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  alertText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  flex: { flex: 1 },
  number: {
    fontSize: fontSize.xs,
    fontFamily: 'monospace',
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '700',
    marginTop: 2,
  },
  customer: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: fontSize.sm,
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
