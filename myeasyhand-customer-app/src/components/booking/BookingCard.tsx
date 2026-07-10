import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '@/constants';
import { formatDate, formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface BookingCardProps {
  booking: Booking;
  onPress?: () => void;
}

export function BookingCard({ booking, onPress }: BookingCardProps) {
  const { theme } = useTheme();
  const serviceName =
    typeof booking.serviceId === 'object' ? booking.serviceId?.name : 'Service Booking';
  const statusColor = BOOKING_STATUS_COLORS[booking.status] || theme.accent;

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: theme.secondary }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.number, { color: theme.textLowContrast }]}>{booking.bookingNumber}</Text>
          <Text style={[styles.title, { color: theme.textHighContrast }]}>{serviceName}</Text>
        </View>
        <Badge label={BOOKING_STATUS_LABELS[booking.status] || booking.status} color={statusColor} />
      </View>
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Feather name="calendar" size={14} color={theme.textLowContrast} />
          <Text style={[styles.metaText, { color: theme.textLowContrast }]}>
            {formatDate(booking.scheduledAt)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  number: {
    fontSize: fontSize.xs,
    fontFamily: 'monospace',
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '700',
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
