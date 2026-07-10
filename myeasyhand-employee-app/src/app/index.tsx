import { Redirect } from 'expo-router';
import { LoadingState } from '@/components/ui/EmptyState';
import { useAppSelector } from '@/store/hooks';

export default function Index() {
  const { isAuthenticated, isBootstrapping } = useAppSelector((s) => s.auth);

  if (isBootstrapping) {
    return <LoadingState message="Loading MyEasyHand Employee..." />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
