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
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearError, login } from '@/store/slices/auth.slice';

export default function LoginScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    dispatch(clearError());
    const result = await dispatch(login({ email: email.trim(), password }));
    if (login.fulfilled.match(result)) {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image source={require('../../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.heading, { color: theme.textHighContrast }]}>Employee Login</Text>
          <Text style={[styles.info, { color: theme.textLowContrast }]}>
            Sign in with your employee credentials to manage assigned jobs and schedule.
          </Text>

          <Input
            label="Email"
            leftIcon="mail"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Password"
            leftIcon="lock"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            secureToggle
          />

          <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgot}>
            <Text style={[styles.link, { color: theme.textHighContrast }]}>Forgot password?</Text>
          </Pressable>

          {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

          <Button label="Sign In" onPress={handleLogin} loading={isLoading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.xxl * 2,
  },
  logo: {
    width: 180,
    height: 48,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  heading: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  info: {
    fontSize: fontSize.md,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  link: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  error: {
    marginBottom: spacing.md,
    fontSize: fontSize.sm,
  },
});
