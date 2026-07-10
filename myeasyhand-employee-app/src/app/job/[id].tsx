import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, spacing } from '@/theme';
import { JobTracker } from '@/components/jobs/JobTracker';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/EmptyState';
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS, PAYMENT_METHODS } from '@/constants';
import { bookingApi, getApiErrorMessage } from '@/services/api';
import { formatDate, formatPrice } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import type { BookingStatus, PaymentMethod } from '@/types';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const userId = useAppSelector((s) => s.auth.user?.id);

  const [otp, setOtp] = useState('');
  const [visitDate, setVisitDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [checkInNotes, setCheckInNotes] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [materialName, setMaterialName] = useState('');
  const [materialQty, setMaterialQty] = useState('1');
  const [materialPrice, setMaterialPrice] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const res = await bookingApi.getById(id!);
      return res.data.data;
    },
    enabled: !!id,
    refetchInterval: 30000,
  });

  const invalidate = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
  };

  const respondMutation = useMutation({
    mutationFn: ({
      assignmentId,
      response,
    }: {
      assignmentId: string;
      response: 'accepted' | 'rejected';
    }) => bookingApi.respondToAssignment(id!, assignmentId, response),
    onSuccess: () => {
      Alert.alert('Done', 'Your response has been recorded.');
      invalidate();
    },
    onError: (err) => Alert.alert('Error', getApiErrorMessage(err)),
  });

  const scheduleMutation = useMutation({
    mutationFn: () =>
      bookingApi.scheduleVisit(id!, visitDate.toISOString(), scheduleNotes || undefined),
    onSuccess: () => {
      Alert.alert('Scheduled', 'Visit has been scheduled. OTP generated for customer.');
      invalidate();
    },
    onError: (err) => Alert.alert('Error', getApiErrorMessage(err)),
  });

  const verifyMutation = useMutation({
    mutationFn: () => bookingApi.verifyVisit(id!, { otp }),
    onSuccess: () => {
      Alert.alert('Verified', 'Visit verified successfully.');
      setOtp('');
      invalidate();
    },
    onError: (err) => Alert.alert('Error', getApiErrorMessage(err)),
  });

  const checkInMutation = useMutation({
    mutationFn: () => bookingApi.checkIn(id!, { notes: checkInNotes || undefined }),
    onSuccess: () => {
      Alert.alert('Checked In', 'Service marked as in progress.');
      invalidate();
    },
    onError: (err) => Alert.alert('Error', getApiErrorMessage(err)),
  });

  const approvalMutation = useMutation({
    mutationFn: () => bookingApi.requestApproval(id!, approvalNotes || undefined),
    onSuccess: () => {
      Alert.alert('Sent', 'Approval request sent to customer.');
      invalidate();
    },
    onError: (err) => Alert.alert('Error', getApiErrorMessage(err)),
  });

  const completeMutation = useMutation({
    mutationFn: () => bookingApi.complete(id!, { completionNotes: completionNotes || undefined }),
    onSuccess: () => {
      Alert.alert('Completed', 'Job marked as complete.');
      invalidate();
    },
    onError: (err) => Alert.alert('Error', getApiErrorMessage(err)),
  });

  const paymentMutation = useMutation({
    mutationFn: () =>
      bookingApi.recordPayment(id!, {
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
      }),
    onSuccess: () => {
      Alert.alert('Payment Recorded', 'Payment has been logged.');
      setPaymentAmount('');
      invalidate();
    },
    onError: (err) => Alert.alert('Error', getApiErrorMessage(err)),
  });

  const materialMutation = useMutation({
    mutationFn: () =>
      bookingApi.addMaterial(id!, {
        name: materialName,
        quantity: parseInt(materialQty, 10) || 1,
        unitPrice: parseFloat(materialPrice) || 0,
      }),
    onSuccess: () => {
      Alert.alert('Added', 'Material added to job.');
      setMaterialName('');
      setMaterialQty('1');
      setMaterialPrice('');
      invalidate();
    },
    onError: (err) => Alert.alert('Error', getApiErrorMessage(err)),
  });

  const myAssignment = useMemo(() => {
    if (!data || !userId) return null;
    return data.assignments.find((a) => a.userId?._id === userId);
  }, [data, userId]);

  if (isLoading || !data) return <LoadingState message="Loading job..." />;

  const { booking, lineItems, assignments, materials, payments } = data;
  const serviceName =
    typeof booking.serviceId === 'object' ? booking.serviceId?.name : 'Service Job';
  const customer =
    typeof booking.customerId === 'object' ? booking.customerId : undefined;
  const customerName = [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || 'Customer';
  const statusColor = BOOKING_STATUS_COLORS[booking.status] || theme.accent;
  const pendingResponse =
    myAssignment?.employeeResponse === 'pending' && booking.status === 'employee_assigned';
  const remaining = (booking.totalAmount ?? 0) - (booking.paidAmount ?? 0);

  const callCustomer = () => {
    if (customer?.phone) Linking.openURL(`tel:${customer.phone}`);
    else Alert.alert('No phone', 'Customer phone number is not available.');
  };

  return (
    <>
      <Stack.Screen options={{ title: booking.bookingNumber, headerShown: true }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.primary }]} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.serviceName, { color: theme.textHighContrast }]}>{serviceName}</Text>
          <Badge label={BOOKING_STATUS_LABELS[booking.status]} color={statusColor} />
        </View>
        <Text style={[styles.date, { color: theme.textLowContrast }]}>
          {formatDate(booking.visitScheduledAt || booking.scheduledAt)}
        </Text>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Customer</Text>
          <Text style={[styles.customerName, { color: theme.textHighContrast }]}>{customerName}</Text>
          {customer?.phone ? (
            <Text style={[styles.customerPhone, { color: theme.textLowContrast }]}>{customer.phone}</Text>
          ) : null}
          {customer?.phone ? (
            <Button
              label="Call Customer"
              variant="outline"
              onPress={callCustomer}
              style={{ marginTop: spacing.sm }}
            />
          ) : null}
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Progress</Text>
          <JobTracker status={booking.status as BookingStatus} />
        </Card>

        {pendingResponse && myAssignment ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Assignment Response</Text>
            <Text style={[styles.hint, { color: theme.textLowContrast }]}>
              You have been assigned to this job. Accept or decline the assignment.
            </Text>
            <View style={styles.row}>
              <Button
                label="Accept"
                onPress={() =>
                  respondMutation.mutate({ assignmentId: myAssignment._id, response: 'accepted' })
                }
                loading={respondMutation.isPending}
                style={styles.halfBtn}
              />
              <Button
                label="Decline"
                variant="danger"
                onPress={() =>
                  Alert.alert('Decline Assignment', 'Are you sure you want to decline?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Decline',
                      style: 'destructive',
                      onPress: () =>
                        respondMutation.mutate({
                          assignmentId: myAssignment._id,
                          response: 'rejected',
                        }),
                    },
                  ])
                }
                style={styles.halfBtn}
              />
            </View>
          </Card>
        ) : null}

        {['employee_accepted', 'accepted'].includes(booking.status) ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Schedule Visit</Text>
            <PressableDate
              date={visitDate}
              onPress={() => setShowDatePicker(true)}
              theme={theme}
            />
            {showDatePicker ? (
              <DateTimePicker
                value={visitDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, selected) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selected) setVisitDate(selected);
                }}
              />
            ) : null}
            <Input
              label="Notes (optional)"
              value={scheduleNotes}
              onChangeText={setScheduleNotes}
              placeholder="Any scheduling notes..."
            />
            <Button
              label="Schedule Visit"
              onPress={() => scheduleMutation.mutate()}
              loading={scheduleMutation.isPending}
            />
          </Card>
        ) : null}

        {booking.status === 'visit_scheduled' ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Verify Visit</Text>
            <Text style={[styles.hint, { color: theme.textLowContrast }]}>
              Ask the customer for their visit OTP to verify arrival.
            </Text>
            <Input
              label="Customer OTP"
              value={otp}
              onChangeText={setOtp}
              placeholder="6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
            />
            <Button
              label="Verify OTP"
              onPress={() => verifyMutation.mutate()}
              loading={verifyMutation.isPending}
              disabled={otp.length !== 6}
            />
          </Card>
        ) : null}

        {booking.status === 'visit_started' ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Check In</Text>
            <Input
              label="Notes (optional)"
              value={checkInNotes}
              onChangeText={setCheckInNotes}
              placeholder="Arrival notes..."
            />
            <Button
              label="Check In & Start Service"
              onPress={() => checkInMutation.mutate()}
              loading={checkInMutation.isPending}
            />
          </Card>
        ) : null}

        {['service_in_progress', 'approved'].includes(booking.status) ? (
          <>
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Services</Text>
              {lineItems.map((item) => (
                <View key={item._id} style={styles.lineItem}>
                  <Text style={{ color: theme.textHighContrast, flex: 1 }}>{item.name}</Text>
                  <Text style={{ color: theme.textLowContrast }}>x{item.quantity}</Text>
                  <Text style={{ color: theme.accent, fontWeight: '600', marginLeft: spacing.sm }}>
                    {formatPrice(item.totalPrice)}
                  </Text>
                </View>
              ))}
            </Card>

            {materials.length > 0 ? (
              <Card style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Materials</Text>
                {materials.map((m) => (
                  <View key={m._id} style={styles.lineItem}>
                    <Text style={{ color: theme.textHighContrast, flex: 1 }}>{m.name}</Text>
                    <Text style={{ color: theme.textLowContrast }}>x{m.quantity}</Text>
                    <Text style={{ color: theme.accent, fontWeight: '600', marginLeft: spacing.sm }}>
                      {formatPrice(m.totalPrice)}
                    </Text>
                  </View>
                ))}
              </Card>
            ) : null}

            {booking.status === 'service_in_progress' ? (
              <>
                <Card style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Add Material</Text>
                  <Input label="Material Name" value={materialName} onChangeText={setMaterialName} />
                  <View style={styles.row}>
                    <View style={styles.halfField}>
                      <Input label="Qty" value={materialQty} onChangeText={setMaterialQty} keyboardType="number-pad" />
                    </View>
                    <View style={styles.halfField}>
                      <Input
                        label="Unit Price"
                        value={materialPrice}
                        onChangeText={setMaterialPrice}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                  <Button
                    label="Add Material"
                    variant="secondary"
                    onPress={() => materialMutation.mutate()}
                    loading={materialMutation.isPending}
                    disabled={!materialName.trim()}
                  />
                </Card>

                <Card style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>
                    Request Customer Approval
                  </Text>
                  <Input
                    label="Notes (optional)"
                    value={approvalNotes}
                    onChangeText={setApprovalNotes}
                    placeholder="Describe work done or changes..."
                  />
                  <Button
                    label="Send for Approval"
                    onPress={() => approvalMutation.mutate()}
                    loading={approvalMutation.isPending}
                  />
                </Card>
              </>
            ) : null}

            {booking.status === 'approved' ? (
              <Card style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Complete Job</Text>
                <Input
                  label="Completion Notes (optional)"
                  value={completionNotes}
                  onChangeText={setCompletionNotes}
                  placeholder="Summary of work completed..."
                />
                <Button
                  label="Mark Complete"
                  onPress={() => completeMutation.mutate()}
                  loading={completeMutation.isPending}
                />
              </Card>
            ) : null}
          </>
        ) : null}

        {booking.status === 'awaiting_customer_approval' ? (
          <View style={[styles.section, styles.waitCard, { backgroundColor: `${theme.warning}14` }]}>
            <View style={styles.waitRow}>
              <Feather name="clock" size={20} color={theme.warning} />
              <Text style={[styles.waitText, { color: theme.textHighContrast }]}>
                Waiting for customer approval
              </Text>
            </View>
            {booking.customerApproval?.draftAmount ? (
              <Text style={{ color: theme.textLowContrast, marginTop: spacing.xs }}>
                Draft amount: {formatPrice(booking.customerApproval.draftAmount)}
              </Text>
            ) : null}
          </View>
        ) : null}

        {['completed', 'paid'].includes(booking.status) && remaining > 0 ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Record Payment</Text>
            <Text style={[styles.hint, { color: theme.textLowContrast }]}>
              Remaining: {formatPrice(remaining)}
            </Text>
            <Input
              label="Amount"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="decimal-pad"
              placeholder={String(remaining)}
            />
            <Text style={[styles.fieldLabel, { color: theme.textHighContrast }]}>Payment Method</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map((m) => (
                <Button
                  key={m.value}
                  label={m.label}
                  variant={paymentMethod === m.value ? 'primary' : 'secondary'}
                  onPress={() => setPaymentMethod(m.value as PaymentMethod)}
                  style={styles.methodBtn}
                />
              ))}
            </View>
            <Button
              label="Record Payment"
              onPress={() => paymentMutation.mutate()}
              loading={paymentMutation.isPending}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
            />
          </Card>
        ) : null}

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Price Summary</Text>
          <PriceRow label="Subtotal" value={formatPrice(booking.subtotal)} theme={theme} />
          {booking.discountAmount ? (
            <PriceRow label="Discount" value={`-${formatPrice(booking.discountAmount)}`} theme={theme} success />
          ) : null}
          <PriceRow label="Total" value={formatPrice(booking.totalAmount)} theme={theme} bold accent />
          <PriceRow
            label="Paid"
            value={formatPrice(booking.paidAmount ?? 0)}
            theme={theme}
          />
        </Card>

        {payments.length > 0 ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Payments</Text>
            {payments.map((p) => (
              <View key={p._id} style={styles.lineItem}>
                <Text style={{ color: theme.textHighContrast, textTransform: 'capitalize' }}>{p.method}</Text>
                <Text style={{ color: theme.accent, fontWeight: '600' }}>{formatPrice(p.amount)}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        {assignments.length > 1 ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Team</Text>
            {assignments.map((a) => (
              <View key={a._id} style={styles.lineItem}>
                <Text style={{ color: theme.textHighContrast }}>
                  {[a.userId?.firstName, a.userId?.lastName].filter(Boolean).join(' ')}
                </Text>
                <Badge
                  label={a.employeeResponse ?? 'pending'}
                  color={a.employeeResponse === 'accepted' ? theme.success : theme.warning}
                />
              </View>
            ))}
          </Card>
        ) : null}

        {booking.notes ? (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Customer Notes</Text>
            <Text style={{ color: theme.textLowContrast, lineHeight: 20 }}>{booking.notes}</Text>
          </Card>
        ) : null}
      </ScrollView>
    </>
  );
}

function PressableDate({
  date,
  onPress,
  theme,
}: {
  date: Date;
  onPress: () => void;
  theme: { secondary: string; textHighContrast: string; border: string };
}) {
  return (
    <Button
      label={formatDate(date)}
      variant="secondary"
      onPress={onPress}
      style={{ marginBottom: spacing.md }}
    />
  );
}

function PriceRow({
  label,
  value,
  theme,
  bold,
  accent,
  success,
}: {
  label: string;
  value: string;
  theme: { textHighContrast: string; textLowContrast: string; accent: string; success: string };
  bold?: boolean;
  accent?: boolean;
  success?: boolean;
}) {
  const color = success ? theme.success : accent ? theme.accent : theme.textHighContrast;
  return (
    <View style={styles.priceRow}>
      <Text style={{ color: theme.textLowContrast, fontWeight: bold ? '700' : '400' }}>{label}</Text>
      <Text style={{ color, fontWeight: bold ? '700' : '400', fontSize: bold ? fontSize.md : fontSize.sm }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  serviceName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    flex: 1,
  },
  date: {
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  customerName: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  customerPhone: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  hint: {
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfBtn: {
    flex: 1,
  },
  halfField: {
    flex: 1,
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  waitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  waitText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  waitCard: {
    borderRadius: 16,
    padding: 16,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  methodBtn: {
    paddingHorizontal: spacing.sm,
    height: 36,
  },
});
