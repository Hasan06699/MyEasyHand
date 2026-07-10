import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';
import type { CartItem } from '@/types';
import { formatPrice, getMediaUrl, getServiceImage, getServicePrice } from '@/lib/utils';

interface CartItemCardProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

export function CartItemCard({ item, onIncrease, onDecrease, onRemove }: CartItemCardProps) {
  const { theme } = useTheme();
  const imageUrl = getMediaUrl(getServiceImage(item.service));
  const price = getServicePrice(item.service);

  return (
    <View style={[styles.card, { backgroundColor: theme.secondary }]}>
      <View style={styles.row}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder, { backgroundColor: theme.border }]}>
            <Feather name="image" size={20} color={theme.textLowContrast} />
          </View>
        )}
        <View style={styles.info}>
          <Text numberOfLines={2} style={[styles.name, { color: theme.textHighContrast }]}>
            {item.service.name}
          </Text>
          <Text style={[styles.price, { color: theme.accent }]}>{formatPrice(price)}</Text>
        </View>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Feather name="trash-2" size={18} color={theme.danger} />
        </Pressable>
      </View>
      <View style={styles.qtyRow}>
        <Pressable onPress={onDecrease} style={[styles.qtyBtn, { backgroundColor: theme.primary }]}>
          <Feather name="minus" size={16} color={theme.textHighContrast} />
        </Pressable>
        <Text style={[styles.qty, { color: theme.textHighContrast }]}>{item.quantity}</Text>
        <Pressable onPress={onIncrease} style={[styles.qtyBtn, { backgroundColor: theme.accent }]}>
          <Feather name="plus" size={16} color={theme.primary} />
        </Pressable>
        <Text style={[styles.total, { color: theme.textHighContrast }]}>
          {formatPrice(price * item.quantity)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  price: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginTop: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    fontSize: fontSize.md,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  total: {
    marginLeft: 'auto',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
