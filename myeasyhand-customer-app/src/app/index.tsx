import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { LoadingState } from '@/components/ui/EmptyState';
import { getHasCompletedOnboarding } from '@/lib/onboarding';
import { useAppSelector } from '@/store/hooks';

export default function Index() {
  const { isAuthenticated, isBootstrapping, pendingOtpUserId } = useAppSelector((s) => s.auth);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    getHasCompletedOnboarding().then((completed) => {
      setShowOnboarding(!completed);
      setOnboardingReady(true);
    });
  }, []);

  if (isBootstrapping || !onboardingReady) {
    return <LoadingState message="Loading MyEasyHand..." />;
  }

  if (showOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  if (pendingOtpUserId) {
    return <Redirect href="/(auth)/verify-otp" />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
