import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearError, register } from '@/store/slices/auth.slice';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    dispatch(clearError());
    const result = await dispatch(
      register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      }),
    );
    if (register.fulfilled.match(result)) {
      if (result.payload.requiresOtp) {
        router.replace('/(auth)/verify-otp');
      } else {
        router.replace('/(tabs)');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image source={require('../../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.heading, { color: theme.textHighContrast }]}>Create Account</Text>
          <Text style={[styles.info, { color: theme.textLowContrast }]}>
            Join MyEasyHand to book trusted services at your doorstep.
          </Text>

          <Input label="First Name" value={form.firstName} onChangeText={(v) => update('firstName', v)} placeholder="First name" />
          <Input label="Last Name" value={form.lastName} onChangeText={(v) => update('lastName', v)} placeholder="Last name" />
          <Input
            label="Email"
            leftIcon="mail"
            value={form.email}
            onChangeText={(v) => update('email', v)}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Phone (optional)"
            leftIcon="phone"
            value={form.phone}
            onChangeText={(v) => update('phone', v)}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />
          <Input
            label="Password"
            leftIcon="lock"
            value={form.password}
            onChangeText={(v) => update('password', v)}
            placeholder="Create a password"
            secureTextEntry
            secureToggle
          />

          {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

          <Button label="Register" onPress={handleRegister} loading={isLoading} />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textLowContrast }]}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={[styles.link, { color: theme.accent }]}>Login</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.xl, paddingTop: spacing.xl },
  logo: {
    width: 180,
    height: 48,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  heading: { fontSize: fontSize.xxl, fontWeight: '700', marginBottom: spacing.sm },
  info: { fontSize: fontSize.md, marginBottom: spacing.lg, lineHeight: 22 },
  error: { marginBottom: spacing.md, fontSize: fontSize.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { fontSize: fontSize.sm },
  link: { fontSize: fontSize.sm, fontWeight: '600' },
});
