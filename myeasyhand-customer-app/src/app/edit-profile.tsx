import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi, getApiErrorMessage } from '@/services/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadUser } from '@/store/slices/auth.slice';

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      authApi.updateMe({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
      }),
    onSuccess: () => {
      dispatch(loadUser());
      Alert.alert('Saved', 'Profile updated successfully.');
      router.back();
    },
    onError: (err) => Alert.alert('Error', getApiErrorMessage(err)),
  });

  if (!user) {
    router.replace('/(auth)/login');
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Profile', headerShown: true }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.primary }]} contentContainerStyle={styles.content}>
        <Input label="First Name" value={form.firstName} onChangeText={(v) => setForm((p) => ({ ...p, firstName: v }))} />
        <Input label="Last Name" value={form.lastName} onChangeText={(v) => setForm((p) => ({ ...p, lastName: v }))} />
        <Input
          label="Phone"
          value={form.phone}
          onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
          keyboardType="phone-pad"
        />
        <Input label="Email" value={user.email} editable={false} />
        <Button label="Save Changes" onPress={() => updateMutation.mutate()} loading={updateMutation.isPending} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
