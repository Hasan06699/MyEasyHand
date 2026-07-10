import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { authApi } from '@/services/api';
import { clearError, verifyOtp } from '@/store/slices/auth.slice';

export default function VerifyOtpScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading, error, pendingOtpUserId } = useAppSelector((s) => s.auth);
  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const userId = pendingOtpUserId;

  const handleVerify = async () => {
    if (!userId) {
      router.replace('/(auth)/login');
      return;
    }
    dispatch(clearError());
    const result = await dispatch(verifyOtp({ userId, code: code.trim() }));
    if (verifyOtp.fulfilled.match(result)) {
      router.replace('/(tabs)');
    }
  };

  const handleResend = async () => {
    if (!userId) return;
    setResending(true);
    setResendMsg('');
    try {
      await authApi.resendOtp(userId);
      setResendMsg('OTP sent again.');
    } catch {
      setResendMsg('Could not resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.primary }]}>
      <View style={styles.content}>
        <Text style={[styles.heading, { color: theme.textHighContrast }]}>Verify OTP</Text>
        <Text style={[styles.info, { color: theme.textLowContrast }]}>
          Enter the verification code sent to your email or phone.
        </Text>

        <Input
          label="OTP Code"
          leftIcon="shield"
          value={code}
          onChangeText={setCode}
          placeholder="6-digit code"
          keyboardType="number-pad"
          maxLength={6}
        />

        {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
        {resendMsg ? <Text style={[styles.info, { color: theme.success }]}>{resendMsg}</Text> : null}

        <Button label="Verify" onPress={handleVerify} loading={isLoading} />
        <Button label="Resend OTP" variant="outline" onPress={handleResend} loading={resending} style={styles.resend} />
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
  resend: { marginTop: spacing.md },
});
