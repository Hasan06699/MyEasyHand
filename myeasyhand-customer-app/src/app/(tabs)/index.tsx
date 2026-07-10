import React from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, spacing } from '@/theme';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { HomeSearchBar } from '@/components/search/HomeSearchBar';
import { CategoryCard } from '@/components/services/CategoryCard';
import { ServiceCard } from '@/components/services/ServiceCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingState } from '@/components/ui/EmptyState';
import { promotionApi, serviceApi } from '@/services/api';
import { normalizePromotionBanner, normalizeServiceRow, type ApiPromotionBanner, type ApiServiceRow } from '@/lib/promotions';
import { useAppSelector } from '@/store/hooks';
import { getUserDisplayName } from '@/lib/utils';

export default function HomeScreen() {
  const { theme } = useTheme();
  const user = useAppSelector((s) => s.auth.user);

  const { data: banners = [], isLoading: bannersLoading } = useQuery({
    queryKey: ['banners', 'home'],
    queryFn: async () => {
      const res = await promotionApi.activeBanners({ location: 'home', platform: 'mobile_app' });
      return (res.data.data as ApiPromotionBanner[])
        .map(normalizePromotionBanner)
        .filter((b): b is NonNullable<typeof b> => b !== null);
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await serviceApi.categories(true);
      return res.data.data.filter((c) => !c.parentId);
    },
  });

  const { data: featured = [] } = useQuery({
    queryKey: ['services', 'featured'],
    queryFn: async () => {
      const res = await serviceApi.list({ featured: true, limit: 8 });
      return res.data.data;
    },
  });

  const { data: popular = [] } = useQuery({
    queryKey: ['services', 'popular'],
    queryFn: async () => {
      const res = await serviceApi.list({ popular: true, limit: 8 });
      return res.data.data;
    },
  });

  const { data: serviceRows = [] } = useQuery({
    queryKey: ['service-rows', 'home'],
    queryFn: async () => {
      const res = await promotionApi.activeServiceRows({ location: 'home', platform: 'mobile_app' });
      return (res.data.data as ApiServiceRow[]).map(normalizeServiceRow);
    },
  });

  if (bannersLoading && categories.length === 0) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textLowContrast }]}>Hi,</Text>
            <Text style={[styles.name, { color: theme.textHighContrast }]}>
              {getUserDisplayName(user?.firstName, user?.lastName)}!
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/notifications')}
              style={[styles.iconBtn, { backgroundColor: theme.secondary }]}>
              <Feather name="bell" size={20} color={theme.textHighContrast} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/cart')}
              style={[styles.iconBtn, { backgroundColor: theme.secondary }]}>
              <Feather name="shopping-cart" size={20} color={theme.textHighContrast} />
            </Pressable>
          </View>
        </View>

        <HomeSearchBar onPress={() => router.push('/search')} />

        <BannerCarousel banners={banners} />

        {categories.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="Categories"
              actionLabel="See all"
              onAction={() => router.push('/categories')}
            />
            <FlatList
              horizontal
              data={categories}
              keyExtractor={(item) => item._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              renderItem={({ item, index }) => (
                <CategoryCard
                  category={item}
                  selected={index === 0}
                  onPress={() => router.push(`/category/${item.slug}`)}
                />
              )}
            />
          </View>
        ) : null}

        {featured.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="Featured"
              actionLabel="See all"
              onAction={() => router.push('/search')}
            />
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(item) => item._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              renderItem={({ item }) => (
                <ServiceCard service={item} onPress={() => router.push(`/service/${item._id}`)} />
              )}
            />
          </View>
        ) : null}

        {popular.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Most Popular" />
            <FlatList
              horizontal
              data={popular}
              keyExtractor={(item) => item._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              renderItem={({ item }) => (
                <ServiceCard service={item} onPress={() => router.push(`/service/${item._id}`)} />
              )}
            />
          </View>
        ) : null}

        {serviceRows.map((row) =>
          row.services?.length ? (
            <View key={row._id} style={styles.section}>
              <SectionHeader title={row.title} subtitle={row.subtitle} />
              <FlatList
                horizontal
                data={row.services}
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hList}
                renderItem={({ item }) => (
                  <ServiceCard service={item} onPress={() => router.push(`/service/${item._id}`)} />
                )}
              />
            </View>
          ) : null,
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  greeting: { fontSize: fontSize.sm },
  name: { fontSize: fontSize.xl, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginBottom: spacing.xl },
  hList: { paddingHorizontal: spacing.lg },
});
