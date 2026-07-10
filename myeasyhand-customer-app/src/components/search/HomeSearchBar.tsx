import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';

interface HomeSearchBarProps {
  onPress: () => void;
}

export function HomeSearchBar({ onPress }: HomeSearchBarProps) {
  const { theme } = useTheme();

  return (
    <Pressable onPress={onPress} style={[styles.wrap, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
      <Feather name="search" size={20} color={theme.textLowContrast} />
      <Text style={[styles.placeholder, { color: theme.textLowContrast }]}>
        Search services, categories...
      </Text>
      <View style={[styles.filterBtn, { backgroundColor: theme.accent }]}>
        <Feather name="sliders" size={16} color={theme.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  placeholder: {
    flex: 1,
    fontSize: fontSize.md,
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
