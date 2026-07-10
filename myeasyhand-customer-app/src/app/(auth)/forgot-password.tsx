import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi, getApiErrorMessage } from '@/services/api';

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await authApi.forgotPassword(email.trim());
      setMessage('If an account exists, a 6-digit reset code has been sent to your email.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Request failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]}>
      <View style={styles.content}>
        <Text style={[styles.heading, { color: theme.textHighContrast }]}>Forgot Password</Text>
        <Text style={[styles.info, { color: theme.textLowContrast }]}>
          Enter your email and we&apos;ll send a 6-digit reset code.
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
        {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
        {message ? <Text style={[styles.success, { color: theme.success }]}>{message}</Text> : null}
        <Button label="Send Reset Code" onPress={handleSubmit} loading={loading} />
        {message ? (
          <Button
            label="Enter Reset Code"
            variant="secondary"
            onPress={() => router.push({ pathname: '/(auth)/reset-password', params: { email: email.trim() } })}
          />
        ) : null}
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.link, { color: theme.accent }]}>Back to login</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.xl, paddingTop: spacing.xxl },
  heading: { fontSize: fontSize.xxl, fontWeight: '700', marginBottom: spacing.sm },
  info: { fontSize: fontSize.md, marginBottom: spacing.xl, lineHeight: 22 },
  error: { marginBottom: spacing.md, fontSize: fontSize.sm },
  success: { marginBottom: spacing.md, fontSize: fontSize.sm },
  back: { marginTop: spacing.lg, alignItems: 'center' },
  link: { fontSize: fontSize.sm, fontWeight: '600' },
});
