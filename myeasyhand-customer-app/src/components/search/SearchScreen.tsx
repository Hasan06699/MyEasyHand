import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';
import { CategoryCard } from '@/components/services/CategoryCard';
import { ServiceCard } from '@/components/services/ServiceCard';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import { addRecentSearch, clearRecentSearches, getRecentSearches } from '@/lib/search-history';
import { serviceApi } from '@/services/api';

export function SearchScreen() {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query.trim(), 350);

  const loadRecent = useCallback(async () => {
    setRecent(await getRecentSearches());
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await serviceApi.categories(true);
      return res.data.data.filter((c) => !c.parentId);
    },
  });

  const { data: services = [], isLoading, isFetching } = useQuery({
    queryKey: ['services', 'search', debouncedQuery],
    queryFn: async () => {
      const res = await serviceApi.list({ q: debouncedQuery, limit: 40 });
      return res.data.data;
    },
    enabled: debouncedQuery.length >= 2,
  });

  const openService = async (serviceId: string, term?: string) => {
    if (term) await addRecentSearch(term);
    router.push(`/service/${serviceId}`);
  };

  const submitSearch = async () => {
    const term = query.trim();
    if (!term) return;
    await addRecentSearch(term);
    await loadRecent();
    Keyboard.dismiss();
  };

  const showResults = debouncedQuery.length >= 2;
  const showRecent = !showResults && recent.length > 0;
  const showCategories = !showResults;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={theme.textHighContrast} />
        </Pressable>
        <View style={[styles.inputWrap, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
          <Feather name="search" size={18} color={theme.textLowContrast} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search services..."
            placeholderTextColor={theme.textLowContrast}
            style={[styles.input, { color: theme.textHighContrast }]}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
            clearButtonMode="while-editing"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Feather name="x-circle" size={18} color={theme.textLowContrast} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {showRecent ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Recent Searches</Text>
            <Pressable onPress={async () => { await clearRecentSearches(); setRecent([]); }}>
              <Text style={[styles.clearText, { color: theme.accent }]}>Clear</Text>
            </Pressable>
          </View>
          <View style={styles.chips}>
            {recent.map((term) => (
              <Pressable
                key={term}
                onPress={() => setQuery(term)}
                style={[styles.chip, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                <Feather name="clock" size={14} color={theme.textLowContrast} />
                <Text style={[styles.chipText, { color: theme.textHighContrast }]}>{term}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {showCategories && !showResults ? (
        <ScrollView contentContainerStyle={styles.listPad} keyboardShouldPersistTaps="handled">
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Browse Categories</Text>
            <Pressable onPress={() => router.push('/categories')}>
              <Text style={[styles.clearText, { color: theme.accent }]}>See all</Text>
            </Pressable>
          </View>
          <View style={styles.categoryGrid}>
            {categories.map((item) => (
              <View key={item._id} style={styles.categoryCell}>
                <CategoryCard
                  category={item}
                  compact
                  onPress={() => router.push(`/category/${item.slug}`)}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}

      {showResults ? (
        isLoading || isFetching ? (
          <LoadingState message="Searching..." />
        ) : (
          <FlatList
            data={services}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listPad}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <EmptyState
                title="No results found"
                message={`We couldn't find services matching "${debouncedQuery}".`}
              />
            }
            renderItem={({ item }) => (
              <ServiceCard
                service={item}
                fullWidth
                onPress={() => openService(item._id, debouncedQuery)}
              />
            )}
          />
        )
      ) : null}

      {!showResults && query.trim().length === 1 ? (
        <Text style={[styles.hint, { color: theme.textLowContrast }]}>Type at least 2 characters to search</Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    paddingVertical: 0,
  },
  section: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  clearText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: fontSize.sm,
  },
  categoryRow: {
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCell: {
    width: '31%',
  },
  listPad: {
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  hint: {
    textAlign: 'center',
    padding: spacing.lg,
    fontSize: fontSize.sm,
  },
});
