import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { setOnboardingComplete } from '@/lib/onboarding';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';
import { useAppSelector } from '@/store/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SlideIcon = keyof typeof Feather.glyphMap;

interface OnboardingSlide {
  id: string;
  icon: SlideIcon;
  title: string;
  description: string;
  accent: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'discover',
    icon: 'search',
    title: 'Discover Services',
    description: 'Browse trusted home services near you — cleaning, repairs, beauty, and more.',
    accent: '#FB8500',
  },
  {
    id: 'book',
    icon: 'calendar',
    title: 'Book in Minutes',
    description: 'Pick a time slot, confirm your booking, and let verified professionals come to you.',
    accent: '#30334F',
  },
  {
    id: 'track',
    icon: 'bell',
    title: 'Track & Stay Updated',
    description: 'Follow your bookings in real time and get notified every step of the way.',
    accent: '#71be34',
  },
];

function SlideContent({
  item,
  index,
  scrollX,
}: {
  item: OnboardingSlide;
  index: number;
  scrollX: Animated.Value;
}) {
  const { theme } = useTheme();

  const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const translateY = scrollX.interpolate({
    inputRange,
    outputRange: [48, 0, 48],
    extrapolate: 'clamp',
  });

  const iconScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.6, 1, 0.6],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Animated.View
        style={[
          styles.iconWrap,
          {
            backgroundColor: `${item.accent}18`,
            opacity,
            transform: [{ translateY }, { scale: iconScale }],
          },
        ]}>
        <View style={[styles.iconCircle, { backgroundColor: item.accent }]}>
          <Feather name={item.icon} size={48} color="#FFFFFF" />
        </View>
      </Animated.View>

      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <Text style={[styles.title, { color: theme.textHighContrast }]}>{item.title}</Text>
        <Text style={[styles.description, { color: theme.textLowContrast }]}>{item.description}</Text>
      </Animated.View>
    </View>
  );
}

function PaginationDot({
  index,
  scrollX,
  activeColor,
}: {
  index: number;
  scrollX: Animated.Value;
  activeColor: string;
}) {
  const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];

  const width = scrollX.interpolate({
    inputRange,
    outputRange: [8, 24, 8],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.4, 1, 0.4],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width,
          opacity,
          backgroundColor: activeColor,
        },
      ]}
    />
  );
}

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const skipOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(skipOpacity, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 500,
        delay: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [footerOpacity, skipOpacity]);

  const finishOnboarding = useCallback(async () => {
    await setOnboardingComplete();
    router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
  }, [isAuthenticated]);

  const goNext = useCallback(() => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      return;
    }
    finishOnboarding();
  }, [activeIndex, finishOnboarding]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
  });

  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]}>
      <Animated.View style={[styles.skipRow, { opacity: skipOpacity }]}>
        <Pressable onPress={finishOnboarding} hitSlop={12} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: theme.textLowContrast }]}>Skip</Text>
        </Pressable>
      </Animated.View>

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => (
          <SlideContent item={item} index={index} scrollX={scrollX} />
        )}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => flatListRef.current?.scrollToIndex({ index: info.index, animated: true }), 100);
        }}
      />

      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, index) => (
            <PaginationDot
              key={index}
              index={index}
              scrollX={scrollX}
              activeColor={theme.accent}
            />
          ))}
        </View>

        <Button
          label={isLastSlide ? 'Get Started' : 'Next'}
          onPress={goNext}
          style={styles.cta}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  iconWrap: {
    marginBottom: spacing.xxl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 8,
  },
  dot: {
    height: 8,
    borderRadius: radius.full,
  },
  cta: {
    width: '100%',
  },
});
