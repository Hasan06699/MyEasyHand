import React from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/EmptyState';
import { ServiceCard } from '@/components/services/ServiceCard';
import { CopyCouponButton } from '@/components/promotions/CopyCouponButton';
import { promotionApi, serviceApi } from '@/services/api';
import { normalizePromotionBanner, type ApiPromotionBanner } from '@/lib/promotions';

export default function PromotionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();

  const { data: banner, isLoading, isError } = useQuery({
    queryKey: ['banner', id],
    queryFn: async () => {
      const res = await promotionApi.activeBannerById(id!, { platform: 'mobile_app' });
      return normalizePromotionBanner(res.data.data as ApiPromotionBanner);
    },
    enabled: !!id,
  });

  const showTopBooked = banner?.bannerType === 'html';

  const { data: topBooked = [], isLoading: topBookedLoading } = useQuery({
    queryKey: ['services', 'popular', 'banner-page'],
    queryFn: async () => {
      const res = await serviceApi.list({ popular: true, limit: 8 });
      return res.data.data;
    },
    enabled: showTopBooked,
  });

  if (isLoading) {
    return <LoadingState message="Loading promotion..." />;
  }

  if (isError || !banner) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.primary }]}>
        <Stack.Screen options={{ title: 'Promotion', headerShown: true }} />
        <Text style={[styles.title, { color: theme.textHighContrast }]}>Promotion not found</Text>
        <Text style={[styles.subtitle, { color: theme.textLowContrast }]}>
          This offer may have expired or is no longer available.
        </Text>
        <Button label="Back to Home" onPress={() => router.replace('/(tabs)')} style={styles.backBtn} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: banner.title, headerShown: true }} />
      <ScrollView
        style={{ backgroundColor: theme.primary }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.textHighContrast }]}>{banner.title}</Text>
        {banner.subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textLowContrast }]}>{banner.subtitle}</Text>
        ) : null}

        {banner.bannerType === 'coupon' && (
          <View style={styles.couponCard}>
            {banner.couponId?.name ? (
              <Text style={styles.couponLabel}>{banner.couponId.name.toUpperCase()}</Text>
            ) : null}
            {banner.couponId?.code ? (
              <>
                <Text style={styles.couponCode}>{banner.couponId.code}</Text>
                <CopyCouponButton code={banner.couponId.code} />
              </>
            ) : (
              <Text style={styles.couponHint}>No coupon is linked to this promotion.</Text>
            )}
            {banner.couponId?.displayValue ? (
              <Text style={styles.couponValue}>{banner.couponId.displayValue}</Text>
            ) : null}
            {banner.couponId?.description ? (
              <Text style={styles.couponDesc}>{banner.couponId.description}</Text>
            ) : null}
            <Text style={styles.couponHint}>Apply this code at checkout to save on your booking.</Text>
          </View>
        )}

        {banner.bannerType === 'html' && banner.htmlContent ? (
          <View style={[styles.htmlWrap, { backgroundColor: theme.secondary }]}>
            <WebView
              originWhitelist={['*']}
              source={{ html: wrapHtml(banner.htmlContent) }}
              style={styles.webview}
              scrollEnabled={false}
            />
          </View>
        ) : null}

        {banner.bannerType === 'services' ? (
          banner.services && banner.services.length > 0 ? (
            <FlatList
              data={banner.services}
              keyExtractor={(item) => item._id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.serviceRow}
              contentContainerStyle={styles.serviceList}
              renderItem={({ item }) => (
                <ServiceCard
                  service={item}
                  compact
                  onPress={() => router.push(`/service/${item._id}`)}
                />
              )}
            />
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: theme.secondary }]}>
              <Text style={{ color: theme.textLowContrast }}>
                No services are available for this promotion right now.
              </Text>
            </View>
          )
        ) : null}

        {showTopBooked ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Top Booked Services</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textLowContrast }]}>
              Popular services customers are booking right now
            </Text>
            {topBookedLoading ? (
              <LoadingState message="Loading services..." />
            ) : (
              <FlatList
                horizontal
                data={topBooked}
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hList}
                renderItem={({ item }) => (
                  <ServiceCard
                    service={item}
                    compact
                    onPress={() => router.push(`/service/${item._id}`)}
                  />
                )}
              />
            )}
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

function wrapHtml(content: string) {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:-apple-system,sans-serif;padding:16px;margin:0;line-height:1.5;color:#1e293b}img{max-width:100%;height:auto}</style></head><body>${content}</body></html>`;
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: fontSize.md,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  backBtn: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
  couponCard: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#99d5d8',
    backgroundColor: '#e8f7f8',
    padding: spacing.xl,
    alignItems: 'center',
  },
  couponLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: '#0d6b70',
    letterSpacing: 1,
  },
  couponCode: {
    marginTop: spacing.md,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  couponValue: {
    marginTop: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#0d6b70',
  },
  couponDesc: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: '#475569',
    textAlign: 'center',
  },
  couponHint: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: '#64748b',
    textAlign: 'center',
  },
  htmlWrap: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    overflow: 'hidden',
    minHeight: 200,
  },
  webview: {
    minHeight: 280,
    backgroundColor: 'transparent',
  },
  serviceList: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  serviceRow: {
    gap: spacing.sm,
  },
  emptyBox: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  hList: {
    gap: spacing.sm,
  },
});
