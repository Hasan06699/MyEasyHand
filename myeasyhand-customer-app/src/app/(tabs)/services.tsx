import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';
import { ServiceCard } from '@/components/services/ServiceCard';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { serviceApi } from '@/services/api';

export default function ServicesScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q || '');

  useEffect(() => {
    if (params.q) setQuery(params.q);
  }, [params.q]);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', 'list', query],
    queryFn: async () => {
      const res = await serviceApi.list({ limit: 50, q: query || undefined });
      return res.data.data;
    },
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]} edges={['top']}>
      <View style={styles.searchRow}>
        <Feather name="search" size={18} color={theme.textLowContrast} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search services..."
          placeholderTextColor={theme.textLowContrast}
          style={[styles.searchInput, { color: theme.textHighContrast }]}
        />
      </View>

      {isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState title="No services found" message="Try a different search term." />
          }
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              fullWidth
              onPress={() => router.push(`/service/${item._id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radius.md,
    gap: spacing.sm,
    backgroundColor: '#F6F5F6',
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
});
