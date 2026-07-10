import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, spacing } from '@/theme';
import { CartItemCard } from '@/components/booking/CartItemCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  removeItem,
  selectCartItems,
  selectCartSubtotal,
  updateQuantity,
} from '@/store/slices/cart.slice';
import { formatPrice } from '@/lib/utils';
import { Text } from 'react-native';

export default function CartScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    router.push('/checkout');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Cart', headerShown: true }} />
      <View style={[styles.container, { backgroundColor: theme.primary }]}>
        {items.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            message="Add services to get started."
            action={<Button label="Browse Services" onPress={() => router.push('/(tabs)/services')} />}
          />
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={(item) => item.serviceId}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <CartItemCard
                  item={item}
                  onIncrease={() =>
                    dispatch(updateQuantity({ serviceId: item.serviceId, quantity: item.quantity + 1 }))
                  }
                  onDecrease={() =>
                    dispatch(updateQuantity({ serviceId: item.serviceId, quantity: item.quantity - 1 }))
                  }
                  onRemove={() => dispatch(removeItem(item.serviceId))}
                />
              )}
            />
            <View style={[styles.footer, { backgroundColor: theme.secondary, borderTopColor: theme.border }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.textHighContrast }]}>Subtotal</Text>
                <Text style={[styles.totalValue, { color: theme.accent }]}>{formatPrice(subtotal)}</Text>
              </View>
              <Button label="Proceed to Checkout" onPress={handleCheckout} />
            </View>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: spacing.lg, paddingBottom: 120 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  totalLabel: { fontSize: fontSize.md, fontWeight: '600' },
  totalValue: { fontSize: fontSize.lg, fontWeight: '700' },
});
