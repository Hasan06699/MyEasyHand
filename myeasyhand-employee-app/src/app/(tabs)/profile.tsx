import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import { getUserDisplayName } from '@/lib/utils';

export default function ProfileScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const dispatch = useAppDispatch();
  const { user, employee } = useAppSelector((s) => s.auth);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await dispatch(logout());
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const businessName =
    employee && typeof employee.businessId === 'object' ? employee.businessId.name : undefined;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.textHighContrast }]}>Profile</Text>

        <Card style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: `${theme.accent}22` }]}>
            <Text style={[styles.avatarText, { color: theme.accent }]}>
              {(user?.firstName?.[0] ?? 'E').toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.name, { color: theme.textHighContrast }]}>
            {getUserDisplayName(user?.firstName, user?.lastName)}
          </Text>
          <Text style={[styles.email, { color: theme.textLowContrast }]}>{user?.email}</Text>
          {employee ? (
            <View style={[styles.codeBadge, { backgroundColor: `${theme.accent}18` }]}>
              <Text style={[styles.codeText, { color: theme.accent }]}>{employee.employeeCode}</Text>
            </View>
          ) : null}
        </Card>

        <Card style={styles.infoCard}>
          <InfoRow icon="briefcase" label="Designation" value={employee?.designation ?? '—'} theme={theme} />
          <InfoRow
            icon="users"
            label="Type"
            value={employee?.employeeType === 'service_staff' ? 'Service Staff' : 'Office Staff'}
            theme={theme}
          />
          <InfoRow icon="phone" label="Phone" value={user?.phone ?? '—'} theme={theme} />
          <InfoRow icon="home" label="Business" value={businessName ?? '—'} theme={theme} />
          <InfoRow
            icon="activity"
            label="Status"
            value={employee?.status ?? '—'}
            theme={theme}
            capitalize
          />
        </Card>

        <View style={styles.menu}>
          <MenuItem
            icon="edit-2"
            label="Edit Profile"
            onPress={() => router.push('/edit-profile')}
            theme={theme}
          />
          <MenuItem
            icon="bell"
            label="Notifications"
            onPress={() => router.push('/notifications')}
            theme={theme}
          />
          <MenuItem
            icon={isDark ? 'sun' : 'moon'}
            label={isDark ? 'Light Mode' : 'Dark Mode'}
            onPress={toggleTheme}
            theme={theme}
          />
        </View>

        <Button label="Sign Out" variant="outline" onPress={handleLogout} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  theme,
  capitalize,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  theme: { textHighContrast: string; textLowContrast: string };
  capitalize?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={16} color={theme.textLowContrast} />
      <Text style={[styles.infoLabel, { color: theme.textLowContrast }]}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          { color: theme.textHighContrast },
          capitalize && { textTransform: 'capitalize' },
        ]}>
        {value}
      </Text>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  theme,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  theme: { secondary: string; textHighContrast: string; textLowContrast: string };
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.menuItem, { backgroundColor: theme.secondary }]}>
      <Feather name={icon} size={18} color={theme.textHighContrast} />
      <Text style={[styles.menuLabel, { color: theme.textHighContrast }]}>{label}</Text>
      <Feather name="chevron-right" size={18} color={theme.textLowContrast} />
    </Pressable>
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
    marginBottom: spacing.lg,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  email: {
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  codeBadge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  codeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  infoCard: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    width: 90,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  menu: {
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
});
