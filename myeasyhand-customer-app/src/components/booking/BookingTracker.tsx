import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, spacing } from '@/theme';
import type { BookingStatus } from '@/types';
import { BOOKING_TRACKING_STEPS } from '@/constants';
import { getBookingStepIndex } from '@/lib/utils';

interface BookingTrackerProps {
  status: BookingStatus;
}

export function BookingTracker({ status }: BookingTrackerProps) {
  const { theme } = useTheme();
  const currentIndex = getBookingStepIndex(status);

  return (
    <View style={styles.container}>
      {BOOKING_TRACKING_STEPS.map((step, index) => {
        const isComplete = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <View key={step.key} style={styles.stepRow}>
            <View style={styles.leftCol}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: isComplete ? theme.accent : theme.border,
                    borderColor: isCurrent ? theme.accent : 'transparent',
                    borderWidth: isCurrent ? 2 : 0,
                  },
                ]}
              />
              {index < BOOKING_TRACKING_STEPS.length - 1 ? (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: index < currentIndex ? theme.accent : theme.border },
                  ]}
                />
              ) : null}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isComplete ? theme.textHighContrast : theme.textLowContrast,
                  fontWeight: isCurrent ? '700' : '400',
                },
              ]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 36,
  },
  leftCol: {
    alignItems: 'center',
    width: 24,
    marginRight: spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginTop: 2,
  },
  label: {
    fontSize: fontSize.sm,
    paddingTop: 0,
    flex: 1,
  },
});
