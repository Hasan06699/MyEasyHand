import React from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';
import type { PromotionBanner } from '@/types';
import { getMediaUrl } from '@/lib/utils';
import { handleBannerPress, isBannerClickable, textPositionLayout } from '@/lib/bannerUtils';
import { CopyCouponButton } from '@/components/promotions/CopyCouponButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const BANNER_HEIGHT = 170;
const BRAND_NAVY = '#1565C0';
const BRAND_TEAL = '#31c1ca';

interface BannerCarouselProps {
  banners: PromotionBanner[];
}

function BannerSlide({
  item,
  theme,
}: {
  item: PromotionBanner;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const imageUrl = getMediaUrl(item.mobileImageUrl || item.imageUrl);
  const showImage = !!imageUrl && !imageFailed;
  const imageOnly = item.showImageOnly ?? false;
  const position = textPositionLayout(item.textPosition ?? 'center-left');
  const clickable = isBannerClickable(item) && item.bannerType !== 'coupon';

  const onPress = () => handleBannerPress(item, router);

  const textBlock = !imageOnly ? (
    <View style={[styles.textBlock, { alignItems: position.alignItems }]}>
      <Text
        style={[
          styles.bannerTitle,
          { color: item.textColor || '#FFFFFF', textAlign: position.textAlign },
        ]}>
        {item.title}
      </Text>
      {item.subtitle ? (
        <Text
          style={[
            styles.bannerSubtitle,
            { color: item.textColor || 'rgba(255,255,255,0.9)', textAlign: position.textAlign },
          ]}>
          {item.subtitle}
        </Text>
      ) : null}
      {item.bannerType === 'coupon' && item.couponId?.code ? (
        <View style={styles.couponBtn}>
          <CopyCouponButton code={item.couponId.code} />
        </View>
      ) : null}
      {clickable ? (
        <Text style={[styles.tapHint, { textAlign: position.textAlign }]}>
          {item.bannerType === 'link' ? 'Tap to open' : 'Tap to view'}
        </Text>
      ) : null}
    </View>
  ) : null;

  const content = (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: item.backgroundColor || BRAND_NAVY,
          width: BANNER_WIDTH,
        },
      ]}>
      {showImage ? (
        <>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            onError={() => setImageFailed(true)}
          />
          {!imageOnly ? <View style={styles.imageOverlay} /> : null}
        </>
      ) : null}
      {!imageOnly ? (
      <View
        style={[
          styles.contentLayer,
          {
            justifyContent: position.justifyContent,
            padding: spacing.lg,
          },
        ]}>
        {textBlock}
      </View>
      ) : null}
    </View>
  );

  if (clickable) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}

function EmptyBanner() {
  return (
    <View style={[styles.emptyBanner, { width: BANNER_WIDTH }]}>
      <Text style={styles.emptyTitle}>Book Trusted Services with MyEasyHand</Text>
      <Text style={styles.emptySubtitle}>
        Home cleaning, repairs, and more — schedule in minutes.
      </Text>
    </View>
  );
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = React.useState(0);

  if (!banners.length) {
    return (
      <View style={styles.wrapper}>
        <EmptyBanner />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id}
        snapToInterval={BANNER_WIDTH + spacing.sm}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (BANNER_WIDTH + spacing.sm));
          setActiveIndex(index);
        }}
        renderItem={({ item }) => <BannerSlide item={item} theme={theme} />}
      />
      {banners.length > 1 ? (
        <View style={styles.dots}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === activeIndex ? theme.accent : theme.border,
                  width: i === activeIndex ? 18 : 8,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  banner: {
    height: BANNER_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  contentLayer: {
    flex: 1,
  },
  textBlock: {
    maxWidth: '90%',
  },
  bannerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  bannerSubtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  couponBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  tapHint: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  emptyBanner: {
    height: BANNER_HEIGHT,
    borderRadius: radius.lg,
    padding: spacing.lg,
    justifyContent: 'center',
    backgroundColor: BRAND_NAVY,
    borderWidth: 1,
    borderColor: BRAND_TEAL,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
