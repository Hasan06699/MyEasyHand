import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';
import type { ServiceCategory } from '@/types';
import { getCategoryIconName } from '@/lib/category-icons';
import { getMediaUrl } from '@/lib/utils';

interface CategoryCardProps {
  category: ServiceCategory;
  selected?: boolean;
  compact?: boolean;
  onPress?: () => void;
}

export function CategoryCard({ category, selected, compact, onPress }: CategoryCardProps) {
  const { theme } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getMediaUrl(category.image || category.icon);
  const iconName = useMemo(
    () => getCategoryIconName(category.slug, category.name),
    [category.slug, category.name],
  );
  const showImage = !!imageUrl && !imageFailed;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        compact && styles.compact,
        {
          backgroundColor: selected ? theme.accent : theme.secondary,
          borderColor: selected ? theme.accent : theme.border,
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.primary }]}>
        {showImage ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Feather name={iconName} size={compact ? 20 : 22} color={selected ? theme.accent : theme.textLowContrast} />
        )}
      </View>
      <Text
        numberOfLines={2}
        style={[styles.label, compact && styles.compactLabel, { color: selected ? theme.primary : theme.textHighContrast }]}>
        {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 88,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  compact: {
    width: '100%',
    marginRight: 0,
    marginBottom: 0,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  compactLabel: {
    fontSize: fontSize.xs,
  },
});
