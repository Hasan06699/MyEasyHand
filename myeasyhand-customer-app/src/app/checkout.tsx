import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation } from '@tanstack/react-query';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { bookingApi, couponApi, getApiErrorMessage } from '@/services/api';
import { clearServerCart } from '@/lib/cart-sync';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearCart,
  selectCartItems,
  selectCartSubtotal,
  setCouponCode,
  setLocation,
  setNotes,
  setScheduledAt,
} from '@/store/slices/cart.slice';
import { formatPrice, getBusinessId } from '@/lib/utils';

export default function CheckoutScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const cart = useAppSelector((s) => s.cart);

  const [scheduledDate, setScheduledDate] = useState(
    cart.scheduledAt ? new Date(cart.scheduledAt) : new Date(Date.now() + 86400000),
  );
  const [showPicker, setShowPicker] = useState(false);
  const [cityName, setCityName] = useState(cart.cityName);
  const [areaName, setAreaName] = useState(cart.areaName);
  const [notes, setNotesLocal] = useState(cart.notes);
  const [couponCode, setCouponCodeLocal] = useState(cart.couponCode);
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

  const checkoutMutation = useMutation({
    mutationFn: () =>
      bookingApi.checkout({
        items: items.map((i) => ({
          serviceId: i.serviceId,
          quantity: i.quantity,
          ...(i.notes ? { notes: i.notes } : {}),
        })),
        scheduledAt: scheduledDate.toISOString(),
        notes: notes || undefined,
        couponCode: couponCode || undefined,
        cityName,
        areaName,
      }),
    onSuccess: async () => {
      dispatch(clearCart());
      await clearServerCart();
      Alert.alert('Booking confirmed!', 'Your booking has been placed successfully.', [
        { text: 'View Bookings', onPress: () => router.replace('/(tabs)/bookings') },
      ]);
    },
    onError: (err) => {
      Alert.alert('Checkout failed', getApiErrorMessage(err));
    },
  });

  const handleValidateCoupon = async () => {
    if (!couponCode || items.length === 0) {
      setCouponError('Enter a coupon code');
      return;
    }
    setCouponError('');
    try {
      const businessId = getBusinessId(items[0].service);
      const res = await couponApi.validate({
        code: couponCode,
        businessId,
        subtotal,
        serviceIds: items.map((i) => i.serviceId),
        cityName,
        areaName,
      });
      if (res.data.data.valid) {
        setDiscount(res.data.data.discountAmount || 0);
        dispatch(setCouponCode(couponCode));
      } else {
        setDiscount(0);
        setCouponError(res.data.data.message || 'Invalid coupon');
      }
    } catch (err) {
      setCouponError(getApiErrorMessage(err));
    }
  };

  const total = Math.max(0, subtotal - discount);

  if (items.length === 0) {
    router.replace('/cart');
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Checkout', headerShown: true }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.primary }]} contentContainerStyle={styles.content}>
        <Text style={[styles.label, { color: theme.textHighContrast }]}>Schedule Date & Time</Text>
        <Pressable
          onPress={() => setShowPicker(true)}
          style={[styles.dateBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
          <Text style={{ color: theme.textHighContrast }}>
            {scheduledDate.toLocaleString('en-IN')}
          </Text>
        </Pressable>
        {showPicker ? (
          <DateTimePicker
            value={scheduledDate}
            mode="datetime"
            minimumDate={new Date()}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              setShowPicker(Platform.OS === 'ios');
              if (date) {
                setScheduledDate(date);
                dispatch(setScheduledAt(date.toISOString()));
              }
            }}
          />
        ) : null}

        <Input label="City" value={cityName} onChangeText={setCityName} placeholder="Your city" />
        <Input label="Area / Locality" value={areaName} onChangeText={setAreaName} placeholder="Your area" />
        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={(v) => {
            setNotesLocal(v);
            dispatch(setNotes(v));
          }}
          placeholder="Any special instructions"
          multiline
        />

        <Input
          label="Coupon Code"
          value={couponCode}
          onChangeText={setCouponCodeLocal}
          placeholder="Enter coupon"
        />
        {couponError ? <Text style={[styles.error, { color: theme.danger }]}>{couponError}</Text> : null}
        <Button label="Apply Coupon" variant="outline" onPress={handleValidateCoupon} style={styles.couponBtn} />

        <View style={[styles.summary, { backgroundColor: theme.secondary }]}>
          <View style={styles.summaryRow}>
            <Text style={{ color: theme.textLowContrast }}>Subtotal</Text>
            <Text style={{ color: theme.textHighContrast }}>{formatPrice(subtotal)}</Text>
          </View>
          {discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={{ color: theme.success }}>Discount</Text>
              <Text style={{ color: theme.success }}>-{formatPrice(discount)}</Text>
            </View>
          ) : null}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: theme.textHighContrast }]}>Total</Text>
            <Text style={[styles.totalValue, { color: theme.accent }]}>{formatPrice(total)}</Text>
          </View>
        </View>

        <Button
          label="Confirm Booking"
          loading={checkoutMutation.isPending}
          onPress={() => {
            if (!cityName.trim() || !areaName.trim()) {
              Alert.alert('Missing info', 'Please enter city and area.');
              return;
            }
            dispatch(setLocation({ cityName, areaName }));
            checkoutMutation.mutate();
          }}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  label: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.xs },
  dateBtn: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  error: { fontSize: fontSize.sm, marginBottom: spacing.sm },
  couponBtn: { marginBottom: spacing.lg },
  summary: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E8E7EC',
  },
  totalLabel: { fontSize: fontSize.md, fontWeight: '700' },
  totalValue: { fontSize: fontSize.lg, fontWeight: '700' },
});
