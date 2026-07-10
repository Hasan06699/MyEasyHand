import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme';
import { CategoryCard } from '@/components/services/CategoryCard';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { serviceApi } from '@/services/api';
import type { ServiceCategory } from '@/types';

function flattenCategories(categories: ServiceCategory[]): ServiceCategory[] {
  const result: ServiceCategory[] = [];
  for (const cat of categories) {
    if (!cat.parentId) result.push(cat);
    if (cat.children?.length) {
      result.push(...cat.children);
    }
  }
  return result;
}

export default function CategoriesPage() {
  const { theme } = useTheme();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const res = await serviceApi.categories(true);
      return flattenCategories(res.data.data);
    },
  });

  return (
    <>
      <Stack.Screen options={{ title: 'All Categories', headerShown: true }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]} edges={['bottom']}>
        {isLoading ? (
          <LoadingState />
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item._id}
            numColumns={3}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyState title="No categories" message="Categories will appear here soon." />}
            renderItem={({ item }) => (
              <View style={styles.cell}>
                <CategoryCard
                  category={item}
                  compact
                  onPress={() => router.push(`/category/${item.slug}`)}
                />
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  row: {
    justifyContent: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cell: {
    width: '31%',
  },
});
