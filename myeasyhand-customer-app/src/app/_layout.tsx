import { Stack } from 'expo-router';
import { Providers } from '@/providers';
import { useTheme } from '@/theme/ThemeProvider';

function ThemedStack() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: theme.textHighContrast,
        headerTitleStyle: { fontWeight: '600' },
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: theme.primary },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" options={{ title: 'Home', headerBackTitle: 'Back' }} />
      <Stack.Screen name="service/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="promotion/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="categories" options={{ headerShown: true, title: 'All Categories' }} />
      <Stack.Screen name="category/[slug]" options={{ headerShown: true }} />
      <Stack.Screen name="cart" options={{ headerShown: true, title: 'Cart' }} />
      <Stack.Screen name="checkout" options={{ headerShown: true, title: 'Checkout' }} />
      <Stack.Screen name="booking/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: true, title: 'Edit Profile' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Providers>
      <ThemedStack />
    </Providers>
  );
}
