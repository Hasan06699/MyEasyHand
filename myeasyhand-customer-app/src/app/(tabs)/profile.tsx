import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { CONTACT_EMAIL, CONTACT_PHONE } from '@/constants';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import { selectCartCount } from '@/store/slices/cart.slice';
import { getUserDisplayName } from '@/lib/utils';

const MENU_ITEMS = [
  { icon: 'shopping-cart' as const, label: 'My Cart', route: '/cart' },
  { icon: 'bell' as const, label: 'Notifications', route: '/notifications' },
  { icon: 'edit-3' as const, label: 'Edit Profile', route: '/edit-profile' },
  { icon: 'calendar' as const, label: 'My Bookings', route: '/(tabs)/bookings' },
];

export default function ProfileScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const cartCount = useAppSelector(selectCartCount);

  const handleLogout = async () => {
    await dispatch(logout());
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: theme.secondary }]}>
          <View style={[styles.avatar, { backgroundColor: `${theme.accent}22` }]}>
            <Feather name="user" size={36} color={theme.accent} />
          </View>
          <Text style={[styles.name, { color: theme.textHighContrast }]}>
            {isAuthenticated
              ? getUserDisplayName(user?.firstName, user?.lastName)
              : 'Guest User'}
          </Text>
          <Text style={[styles.email, { color: theme.textLowContrast }]}>
            {isAuthenticated ? user?.email : 'Sign in to access your account'}
          </Text>
          {!isAuthenticated ? (
            <Button label="Login" onPress={() => router.push('/(auth)/login')} style={styles.loginBtn} />
          ) : null}
        </View>

        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route as never)}
            style={[styles.menuItem, { backgroundColor: theme.secondary }]}>
            <View style={styles.menuLeft}>
              <Feather name={item.icon} size={20} color={theme.accent} />
              <Text style={[styles.menuLabel, { color: theme.textHighContrast }]}>{item.label}</Text>
            </View>
            <View style={styles.menuRight}>
              {item.label === 'My Cart' && cartCount > 0 ? (
                <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.badgeText, { color: theme.primary }]}>{cartCount}</Text>
                </View>
              ) : null}
              <Feather name="chevron-right" size={18} color={theme.textLowContrast} />
            </View>
          </Pressable>
        ))}

        <Pressable
          onPress={toggleTheme}
          style={[styles.menuItem, { backgroundColor: theme.secondary }]}>
          <View style={styles.menuLeft}>
            <Feather name={isDark ? 'sun' : 'moon'} size={20} color={theme.accent} />
            <Text style={[styles.menuLabel, { color: theme.textHighContrast }]}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={theme.textLowContrast} />
        </Pressable>

        <View style={[styles.contactCard, { backgroundColor: theme.secondary }]}>
          <Text style={[styles.contactTitle, { color: theme.textHighContrast }]}>Contact Support</Text>
          <Text style={[styles.contactText, { color: theme.textLowContrast }]}>{CONTACT_EMAIL}</Text>
          <Text style={[styles.contactText, { color: theme.textLowContrast }]}>{CONTACT_PHONE}</Text>
        </View>

        {isAuthenticated ? (
          <Button label="Logout" variant="outline" onPress={handleLogout} style={styles.logout} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  profileCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: { fontSize: fontSize.xl, fontWeight: '700' },
  email: { fontSize: fontSize.sm, marginTop: 4 },
  loginBtn: { marginTop: spacing.lg, alignSelf: 'stretch' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuLabel: { fontSize: fontSize.md, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  contactCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  contactTitle: { fontSize: fontSize.md, fontWeight: '700', marginBottom: spacing.sm },
  contactText: { fontSize: fontSize.sm, marginTop: 2 },
  logout: { marginTop: spacing.xl },
});
