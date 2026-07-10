import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/EmptyState';
import { serviceApi } from '@/services/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addItem } from '@/store/slices/cart.slice';
import {
  formatPrice,
  getBusinessName,
  getMediaUrl,
  getServiceImage,
  getServicePrice,
} from '@/lib/utils';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const res = await serviceApi.getById(id!);
      return res.data.data;
    },
    enabled: !!id,
  });

  const handleAddToCart = () => {
    if (!service) return;
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    dispatch(addItem({ service }));
    Alert.alert('Added to cart', `${service.name} has been added to your cart.`, [
      { text: 'Continue', style: 'cancel' },
      { text: 'View Cart', onPress: () => router.push('/cart') },
    ]);
  };

  if (isLoading || !service) {
    return <LoadingState message="Loading service..." />;
  }

  const imageUrl = getMediaUrl(getServiceImage(service));
  const price = getServicePrice(service);

  return (
    <>
      <Stack.Screen options={{ title: service.name, headerShown: true }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.primary }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.hero} contentFit="cover" />
        ) : (
          <View style={[styles.hero, styles.placeholder, { backgroundColor: theme.secondary }]}>
            <Feather name="image" size={48} color={theme.textLowContrast} />
          </View>
        )}

        <View style={styles.body}>
          <Text style={[styles.name, { color: theme.textHighContrast }]}>{service.name}</Text>
          <Text style={[styles.provider, { color: theme.textLowContrast }]}>
            by {getBusinessName(service)}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.accent }]}>{formatPrice(price)}</Text>
            {service.mrp && service.mrp > price ? (
              <Text style={[styles.mrp, { color: theme.textLowContrast }]}>
                {formatPrice(service.mrp)}
              </Text>
            ) : null}
          </View>

          {service.averageRating ? (
            <View style={styles.ratingRow}>
              <Feather name="star" size={16} color="#ffc700" />
              <Text style={[styles.rating, { color: theme.textHighContrast }]}>
                {service.averageRating.toFixed(1)} ({service.reviewCount || 0} reviews)
              </Text>
            </View>
          ) : null}

          {service.shortDescription ? (
            <Text style={[styles.desc, { color: theme.textLowContrast }]}>{service.shortDescription}</Text>
          ) : null}

          {service.features?.length ? (
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>Features</Text>
              {service.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Feather name="check-circle" size={16} color={theme.accent} />
                  <Text style={[styles.featureText, { color: theme.textLowContrast }]}>{f}</Text>
                </View>
              ))}
            </Card>
          ) : null}

          {service.fullDescription ? (
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textHighContrast }]}>About</Text>
              <Text style={[styles.desc, { color: theme.textLowContrast }]}>{service.fullDescription}</Text>
            </Card>
          ) : null}

          <Button label="Add to Cart" onPress={handleAddToCart} style={styles.cta} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { width: '100%', height: 240 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.lg },
  name: { fontSize: fontSize.xl, fontWeight: '700' },
  provider: { fontSize: fontSize.sm, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md },
  price: { fontSize: fontSize.xl, fontWeight: '700' },
  mrp: { fontSize: fontSize.md, textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  rating: { fontSize: fontSize.sm },
  desc: { fontSize: fontSize.md, lineHeight: 22, marginTop: spacing.md },
  section: { marginTop: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  featureText: { fontSize: fontSize.sm, flex: 1 },
  cta: { marginTop: spacing.xl, marginBottom: spacing.xxl },
});
