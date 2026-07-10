import React, { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { settingsApi } from '@/services/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearError, googleLogin } from '@/store/slices/auth.slice';
import { useGoogleSignIn } from '@/lib/google-auth';

export function GoogleSignInButton() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((s) => s.auth);

  const { data: settings } = useQuery({
    queryKey: ['public-auth-settings'],
    queryFn: async () => {
      const res = await settingsApi.getPublic();
      return res.data.data;
    },
  });

  const { response, promptAsync, isReady, clientId } = useGoogleSignIn(settings?.googleClientId);

  useEffect(() => {
    if (response?.type === 'success' && response.params?.id_token) {
      dispatch(clearError());
      dispatch(googleLogin(response.params.id_token)).then((result) => {
        if (googleLogin.fulfilled.match(result)) {
          router.replace('/(tabs)');
        }
      });
    } else if (response?.type === 'error') {
      Alert.alert('Google sign-in failed', 'Please try again.');
    }
  }, [response, dispatch]);

  if (!settings?.googleLoginEnabled) return null;

  const handlePress = async () => {
    if (!clientId) {
      Alert.alert(
        'Google sign-in unavailable',
        'Google client ID is not configured. Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to your environment.',
      );
      return;
    }
    if (!isReady) return;
    dispatch(clearError());
    await promptAsync();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
        <Text style={[styles.or, { color: theme.textLowContrast }]}>or</Text>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
      </View>
      <Button
        label="Continue with Google"
        variant="outline"
        onPress={handlePress}
        loading={isLoading}
        style={styles.btn}
      />
      <View style={styles.googleHint}>
        <Feather name="info" size={14} color={theme.textLowContrast} />
        <Text style={[styles.hintText, { color: theme.textLowContrast }]}>
          Existing email accounts are linked automatically
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  line: { flex: 1, height: 1 },
  or: { fontSize: fontSize.sm, fontWeight: '600' },
  btn: { marginBottom: spacing.sm },
  googleHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  hintText: { fontSize: fontSize.xs },
});
