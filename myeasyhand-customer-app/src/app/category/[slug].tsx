import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme';
import { ServiceCard } from '@/components/services/ServiceCard';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { findCategoryBySlug } from '@/lib/categories';
import { serviceApi } from '@/services/api';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { theme } = useTheme();

  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await serviceApi.categories(true);
      return res.data.data;
    },
  });

  const category = findCategoryBySlug(categories, slug || '');
  const isSubcategory = !!category?.parentId;

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services', 'category', category?._id, isSubcategory],
    queryFn: async () => {
      if (isSubcategory) {
        const res = await serviceApi.list({ categoryId: category!._id, limit: 50 });
        return res.data.data;
      }
      const res = await serviceApi.list({ parentCategoryId: category!._id, limit: 50 });
      return res.data.data;
    },
    enabled: !!category?._id,
  });

  if (catLoading || servicesLoading) return <LoadingState />;

  if (!category) {
    return (
      <>
        <Stack.Screen options={{ title: 'Category', headerShown: true }} />
        <EmptyState title="Category not found" message="This category may have been removed." />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: category.name, headerShown: true }} />
      <FlatList
        style={{ backgroundColor: theme.primary }}
        data={services}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No services" message="No services in this category yet." />}
        renderItem={({ item }) => (
          <ServiceCard
            service={item}
            fullWidth
            onPress={() => router.push(`/service/${item._id}`)}
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
});
