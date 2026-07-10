import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'myeasyhand:onboarding_complete';

export async function getHasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}
