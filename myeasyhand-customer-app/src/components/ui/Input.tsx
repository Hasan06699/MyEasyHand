import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fontSize, radius, spacing } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  secureToggle?: boolean;
}

export function Input({ label, error, leftIcon, secureToggle, style, secureTextEntry, ...props }: InputProps) {
  const { theme } = useTheme();
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  const isSecure = secureToggle ? hidden : secureTextEntry;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: theme.textHighContrast }]}>{label}</Text>
      ) : null}
      <View style={[styles.inputRow, { backgroundColor: theme.secondary, borderColor: error ? theme.danger : theme.border }]}>
        {leftIcon ? (
          <Feather name={leftIcon} size={18} color={theme.textLowContrast} style={styles.icon} />
        ) : null}
        <TextInput
          placeholderTextColor={theme.textLowContrast}
          style={[styles.input, { color: theme.textHighContrast }, style]}
          secureTextEntry={isSecure}
          {...props}
        />
        {secureToggle ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={8}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            <Feather name={hidden ? 'eye' : 'eye-off'} size={18} color={theme.textLowContrast} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    paddingVertical: spacing.sm,
  },
  error: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
