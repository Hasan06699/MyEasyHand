import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi, getApiErrorMessage } from '@/services/api';

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ email: email.trim(), code: code.trim(), newPassword });
      router.replace('/(auth)/login');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid or expired code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]}>
      <View style={styles.content}>
        <Text style={[styles.heading, { color: theme.textHighContrast }]}>Reset Password</Text>
        <Text style={[styles.info, { color: theme.textLowContrast }]}>
          Enter the 6-digit code from your email and choose a new password.
        </Text>
        <Input
          label="Email"
          leftIcon="mail"
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Reset Code"
          leftIcon="hash"
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
        />
        <Input
          label="New Password"
          leftIcon="lock"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password"
          secureTextEntry
          secureToggle
        />
        <Input
          label="Confirm Password"
          leftIcon="lock"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm password"
          secureTextEntry
          secureToggle
        />
        {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
        <Button label="Reset Password" onPress={handleSubmit} loading={loading} />
        <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.back}>
          <Text style={[styles.link, { color: theme.accent }]}>Resend code</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.xl, paddingTop: spacing.xxl * 2 },
  heading: { fontSize: fontSize.xxl, fontWeight: '700', marginBottom: spacing.sm },
  info: { fontSize: fontSize.md, marginBottom: spacing.xl, lineHeight: 22 },
  error: { marginBottom: spacing.md, fontSize: fontSize.sm },
  back: { marginTop: spacing.lg, alignItems: 'center' },
  link: { fontSize: fontSize.sm, fontWeight: '600' },
});
