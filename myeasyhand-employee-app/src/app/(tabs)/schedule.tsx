import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/EmptyState';
import { DAY_NAMES } from '@/constants';
import { employeeApi, getApiErrorMessage } from '@/services/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setEmployee } from '@/store/slices/auth.slice';
import type { AvailabilitySlot } from '@/types';

type DaySlot = {
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
};

const DEFAULT_SLOTS: DaySlot[] = DAY_NAMES.map((_, i) => ({
  dayOfWeek: i,
  isAvailable: i >= 1 && i <= 5,
  startTime: '09:00',
  endTime: '18:00',
}));

function toDaySlots(availability?: AvailabilitySlot[]): DaySlot[] {
  if (!availability?.length) return DEFAULT_SLOTS;
  return DAY_NAMES.map((_, dayOfWeek) => {
    const slot = availability.find((a) => a.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      isAvailable: slot?.isAvailable ?? false,
      startTime: slot?.startTime ?? '09:00',
      endTime: slot?.endTime ?? '18:00',
    };
  });
}

export default function ScheduleScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const employee = useAppSelector((s) => s.auth.employee);
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<DaySlot[]>(() => toDaySlots(employee?.availability));

  useEffect(() => {
    if (employee?.availability) {
      setSlots(toDaySlots(employee.availability));
    }
  }, [employee?.availability]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!employee) throw new Error('Employee profile not loaded');
      const availability = slots
        .filter((s) => s.isAvailable)
        .map(({ dayOfWeek, startTime, endTime, isAvailable }) => ({
          dayOfWeek,
          startTime,
          endTime,
          isAvailable,
        }));
      const res = await employeeApi.updateAvailability(employee._id, availability);
      return res.data.data;
    },
    onSuccess: async (availability) => {
      if (employee) {
        dispatch(setEmployee({ ...employee, availability }));
      }
      queryClient.invalidateQueries({ queryKey: ['employee-profile'] });
      Alert.alert('Saved', 'Your availability has been updated.');
    },
    onError: (err) => Alert.alert('Error', getApiErrorMessage(err)),
  });

  if (!employee) return <LoadingState message="Loading schedule..." />;

  const updateSlot = (dayOfWeek: number, patch: Partial<DaySlot>) => {
    setSlots((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, ...patch } : s)),
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.textHighContrast }]}>My Schedule</Text>
        <Text style={[styles.subtitle, { color: theme.textLowContrast }]}>
          Set your weekly availability. Your manager uses this when assigning jobs.
        </Text>

        {slots.map((slot) => (
          <Card key={slot.dayOfWeek} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={[styles.dayName, { color: theme.textHighContrast }]}>
                {DAY_NAMES[slot.dayOfWeek]}
              </Text>
              <Switch
                value={slot.isAvailable}
                onValueChange={(v) => updateSlot(slot.dayOfWeek, { isAvailable: v })}
                trackColor={{ false: theme.border, true: `${theme.accent}88` }}
                thumbColor={slot.isAvailable ? theme.accent : theme.textLowContrast}
              />
            </View>
            {slot.isAvailable ? (
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Input
                    label="Start"
                    value={slot.startTime}
                    onChangeText={(v) => updateSlot(slot.dayOfWeek, { startTime: v })}
                    placeholder="09:00"
                  />
                </View>
                <View style={styles.timeField}>
                  <Input
                    label="End"
                    value={slot.endTime}
                    onChangeText={(v) => updateSlot(slot.dayOfWeek, { endTime: v })}
                    placeholder="18:00"
                  />
                </View>
              </View>
            ) : (
              <Text style={[styles.offDay, { color: theme.textLowContrast }]}>Not available</Text>
            )}
          </Card>
        ))}

        <Button
          label="Save Availability"
          onPress={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  dayCard: {
    marginBottom: spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dayName: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timeField: {
    flex: 1,
  },
  offDay: {
    fontSize: fontSize.sm,
    fontStyle: 'italic',
  },
});
