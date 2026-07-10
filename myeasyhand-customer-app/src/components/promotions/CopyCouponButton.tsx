import React from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import { fontSize, radius, spacing } from '@/theme';

interface CopyCouponButtonProps {
  code: string;
}

export function CopyCouponButton({ code }: CopyCouponButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Copy failed', `Please copy manually: ${code}`);
    }
  };

  return (
    <Pressable
      onPress={handleCopy}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: '#FFFFFF', opacity: pressed ? 0.85 : 1 },
      ]}>
      <Feather name={copied ? 'check' : 'copy'} size={16} color="#1565C0" />
      <Text style={styles.label}>{copied ? 'Copied!' : 'Copy Coupon Code'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  label: {
    color: '#1565C0',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
