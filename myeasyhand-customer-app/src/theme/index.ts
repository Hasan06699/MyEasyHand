export const colors = {
  accent: '#FB8500',
  white: '#FFFFFF',
  grey: '#F6F5F6',
  greyDark: '#9595BA',
  greyDarkest: '#30334F',
  red: '#ff623d',
  redLightest: '#ff623d14',
  green: '#71be34',
  greenLightest: '#71be3414',
  yellow: '#ffc700',
  yellowLightest: '#ffc70014',
  black: '#000000',
} as const;

export const lightTheme = {
  primary: '#FFFFFF',
  secondary: '#F6F5F6',
  accent: colors.accent,
  textHighContrast: '#30334F',
  textLowContrast: '#868EAE',
  border: '#E8E7EC',
  danger: colors.red,
  success: colors.green,
  warning: colors.yellow,
};

export const darkTheme = {
  primary: '#191822',
  secondary: '#21202d',
  accent: colors.accent,
  textHighContrast: '#FFFFFF',
  textLowContrast: '#ADB4D2',
  border: '#2d2c3a',
  danger: colors.red,
  success: colors.green,
  warning: colors.yellow,
};

export type AppTheme = typeof lightTheme;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;
