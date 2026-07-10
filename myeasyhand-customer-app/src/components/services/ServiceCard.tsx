import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing, colors } from '@/theme';
import type { Service } from '@/types';
import { formatPrice, getMediaUrl, getServiceImage, getServicePrice } from '@/lib/utils';

interface ServiceCardProps {
  service: Service;
  compact?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
}

export function ServiceCard({ service, compact, fullWidth, onPress }: ServiceCardProps) {
  const { theme } = useTheme();
  const imageUrl = getMediaUrl(getServiceImage(service));
  const price = getServicePrice(service);
  const mrp = service.mrp;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: theme.secondary },
        compact && styles.compact,
        fullWidth && styles.fullWidth,
      ]}>
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: theme.border }]}>
            <Feather name="image" size={28} color={theme.textLowContrast} />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text numberOfLines={2} style={[styles.name, { color: theme.textHighContrast }]}>
          {service.name}
        </Text>
        {service.averageRating ? (
          <View style={styles.ratingRow}>
            <Feather name="star" size={12} color={colors.yellow} />
            <Text style={[styles.rating, { color: theme.textLowContrast }]}>
              {service.averageRating.toFixed(1)}
              {service.reviewCount ? ` (${service.reviewCount})` : ''}
            </Text>
          </View>
        ) : null}
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: theme.accent }]}>{formatPrice(price)}</Text>
          {mrp && mrp > price ? (
            <Text style={[styles.mrp, { color: theme.textLowContrast }]}>{formatPrice(mrp)}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  compact: {
    width: '100%',
    marginRight: 0,
    marginBottom: spacing.md,
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
    marginRight: 0,
    marginBottom: spacing.md,
  },
  imageWrap: {
    height: 110,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.sm,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    minHeight: 36,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rating: {
    fontSize: fontSize.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  price: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  mrp: {
    fontSize: fontSize.xs,
    textDecorationLine: 'line-through',
  },
});
