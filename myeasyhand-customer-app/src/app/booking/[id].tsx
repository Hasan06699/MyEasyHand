import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, spacing } from '@/theme';
import { BookingTracker } from '@/components/booking/BookingTracker';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/EmptyState';
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '@/constants';
import { bookingApi, getApiErrorMessage } from '@/services/api';
import { formatDate, formatPrice } from '@/lib/utils';
import type { BookingStatus } from '@/types';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [reviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const res = await bookingApi.getById(id!);
      return res.data.data;
    },
    enabled: !!id,
    refetchInterval: 30000,
  });

  const approvalMutation = useMutation({
    mutationFn: (decision: 'approved' | 'rejected' | 'changes_requested') =>
      bookingApi.customerApproval(id!, decision),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (err) => Alert.alert('Error', getApiErrorMessage(err)),
  });

  const reviewMutation = useMutation({
    mutationFn: () => bookingApi.submitReview(id!, { serviceRating: reviewRating, comment: reviewComment }),
    onSuccess: () => {
      Alert.alert('Thank you!', 'Your review has been submitted.');
      setReviewComment('');
    },
    onError: (err) => Alert.alert('Error', getApiErrorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => bookingApi.cancel(id!),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (err) => Alert.alert('Error', getApiErrorMessage(err)),
  });

  if (isLoading || !data) return <LoadingState message="Loading booking..." />;

  const { booking, lineItems, assignments } = data;
  const visitOtp = booking.visitOtp ?? booking.visitVerification?.otp;
  const statusColor = BOOKING_STATUS_COLORS[booking.status] || theme.accent;
  const canCancel = ['pending', 'accepted'].includes(booking.status);
  const needsApproval = booking.status === 'awaiting_customer_approval';
  const canReview = ['completed', 'paid', 'closed'].includes(booking.status);

  return (
    <>
      <Stack.Screen options={{ title: booking.bookingNumber, headerShown: true }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.primary }]} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.serviceName, { color: theme.textHighContrast }]}>
            {typeof booking.serviceId === 'object' ? booking.serviceId?.name : 'Service Booking'}
          </Text>
          <Badge label={BOOKING_STATUS_LABELS[booking.status]} color={statusColor} />
        </View>
        <Text style={[styles.date, { color: theme.textLowContrast }]}>{formatDate(booking.scheduledAt)}</Text>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Track Status</Text>
          <BookingTracker status={booking.status as BookingStatus} />
        </Card>

        {visitOtp ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Visit OTP</Text>
            <Text style={[styles.otp, { color: theme.accent }]}>{visitOtp}</Text>
            <Text style={[styles.otpHint, { color: theme.textLowContrast }]}>
              Share this OTP with the service professional on arrival.
            </Text>
          </Card>
        ) : null}

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Price Summary</Text>
          <View style={styles.priceRow}>
            <Text style={{ color: theme.textLowContrast }}>Subtotal</Text>
            <Text style={{ color: theme.textHighContrast }}>{formatPrice(booking.subtotal)}</Text>
          </View>
          {booking.discountAmount ? (
            <View style={styles.priceRow}>
              <Text style={{ color: theme.success }}>Discount</Text>
              <Text style={{ color: theme.success }}>-{formatPrice(booking.discountAmount)}</Text>
            </View>
          ) : null}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: theme.textHighContrast }]}>Total</Text>
            <Text style={[styles.totalValue, { color: theme.accent }]}>{formatPrice(booking.totalAmount)}</Text>
          </View>
        </Card>

        {lineItems.length > 0 ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Services</Text>
            {lineItems.map((item) => (
              <View key={item._id} style={styles.lineItem}>
                <Text style={{ color: theme.textHighContrast }}>{item.name} x{item.quantity}</Text>
                <Text style={{ color: theme.textLowContrast }}>{formatPrice(item.totalPrice)}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        {assignments.length > 0 ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Assigned Professional</Text>
            {assignments.map((a) => (
              <Text key={a._id} style={{ color: theme.textLowContrast }}>
                {a.userId?.firstName} {a.userId?.lastName}
                {a.userId?.phone ? ` • ${a.userId.phone}` : ''}
              </Text>
            ))}
          </Card>
        ) : null}

        {needsApproval ? (
          <View style={styles.actions}>
            <Button label="Approve" onPress={() => approvalMutation.mutate('approved')} loading={approvalMutation.isPending} />
            <Button label="Request Changes" variant="outline" onPress={() => approvalMutation.mutate('changes_requested')} />
            <Button label="Reject" variant="ghost" onPress={() => approvalMutation.mutate('rejected')} />
          </View>
        ) : null}

        {canReview ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Leave a Review</Text>
            <Input
              label="Comment"
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Share your experience"
              multiline
            />
            <Button label="Submit Review" onPress={() => reviewMutation.mutate()} loading={reviewMutation.isPending} />
          </Card>
        ) : null}

        {canCancel ? (
          <Button
            label="Cancel Booking"
            variant="outline"
            onPress={() =>
              Alert.alert('Cancel booking?', 'This action cannot be undone.', [
                { text: 'No', style: 'cancel' },
                { text: 'Yes, cancel', style: 'destructive', onPress: () => cancelMutation.mutate() },
              ])
            }
            loading={cancelMutation.isPending}
            style={styles.cancel}
          />
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  serviceName: { fontSize: fontSize.xl, fontWeight: '700', flex: 1 },
  date: { fontSize: fontSize.sm, marginTop: 4, marginBottom: spacing.lg },
  section: { marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.sm },
  otp: { fontSize: 32, fontWeight: '700', letterSpacing: 8, textAlign: 'center', marginVertical: spacing.md },
  otpHint: { fontSize: fontSize.sm, textAlign: 'center' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: '#E8E7EC' },
  totalLabel: { fontWeight: '700' },
  totalValue: { fontSize: fontSize.lg, fontWeight: '700' },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  actions: { gap: spacing.sm, marginBottom: spacing.lg },
  cancel: { marginTop: spacing.md },
});
