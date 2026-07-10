export type DevicePlatform = 'web' | 'admin_web' | 'android' | 'ios';

const SUBSCRIPTION_STORAGE_KEY = 'onesignalSubscriptionId';

export function getStoredSubscriptionId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
}

export function setStoredSubscriptionId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) sessionStorage.setItem(SUBSCRIPTION_STORAGE_KEY, id);
  else sessionStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(onesignal: OneSignalSDK) => void | Promise<void>>;
    __onesignalInitialized?: boolean;
    __onesignalUnavailable?: boolean;
    __onesignalClickHandlerSet?: boolean;
  }
}

interface OneSignalSDK {
  init(options: { appId: string; allowLocalhostAsSecureOrigin?: boolean }): Promise<void>;
  login(externalId: string): Promise<void>;
  logout(): Promise<void>;
  User: {
    PushSubscription: {
      id?: string | null;
      optedIn?: boolean;
      optIn(): Promise<void>;
    };
  };
  Notifications?: {
    requestPermission(): Promise<boolean>;
    addEventListener(
      event: 'click',
      handler: (event: { notification: { additionalData?: Record<string, unknown> } }) => void,
    ): void;
  };
}

function isOneSignalEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) && !window.__onesignalUnavailable;
}

function runWhenReady(callback: (OneSignal: OneSignalSDK) => void | Promise<void>) {
  if (!isOneSignalEnabled()) return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    if (window.__onesignalUnavailable) return;
    try {
      await callback(OneSignal);
    } catch {
      // Domain mismatch or permission denied — must not break app pages
    }
  });
}

async function getSubscriptionId(OneSignal: OneSignalSDK): Promise<string | undefined> {
  try {
    if (!OneSignal.User.PushSubscription.optedIn) {
      await OneSignal.User.PushSubscription.optIn();
    }
  } catch {
    // already opted in or permission denied
  }

  const id = OneSignal.User.PushSubscription.id;
  return id ?? undefined;
}

async function registerDeviceWithBackend(
  platform: DevicePlatform,
  onesignalSubscriptionId?: string,
): Promise<void> {
  try {
    const { authApi } = await import('./api/auth');
    await authApi.registerDevice({
      platform,
      onesignalSubscriptionId,
      deviceLabel: typeof navigator !== 'undefined' ? navigator.platform : undefined,
    });
    if (onesignalSubscriptionId) {
      setStoredSubscriptionId(onesignalSubscriptionId);
    }
  } catch {
    // Non-blocking — OneSignal external id still works for push
  }
}

/** Link MyEasyHand user id on this device and register with backend (multi-device safe). */
export function linkOneSignalUser(userId: string, platform: DevicePlatform = 'web') {
  if (!userId || !isOneSignalEnabled()) return;

  runWhenReady(async (OneSignal) => {
    await OneSignal.login(userId);
    try {
      await OneSignal.Notifications?.requestPermission();
    } catch {
      // ignore
    }
    const subscriptionId = await getSubscriptionId(OneSignal);
    await registerDeviceWithBackend(platform, subscriptionId);
  });
}

export function unlinkOneSignalUser() {
  if (!isOneSignalEnabled()) return;

  const subscriptionId = getStoredSubscriptionId();

  runWhenReady(async (OneSignal) => {
    if (subscriptionId) {
      try {
        const { authApi } = await import('./api/auth');
        await authApi.unregisterDevice(subscriptionId);
      } catch {
        // ignore
      }
    }
    await OneSignal.logout();
    setStoredSubscriptionId(null);
  });
}

function setupPushClickNavigation(OneSignal: OneSignalSDK) {
  if (window.__onesignalClickHandlerSet || !OneSignal.Notifications) return;

  OneSignal.Notifications.addEventListener('click', (event) => {
    const data = event.notification.additionalData ?? {};
    const type = typeof data.type === 'string' ? data.type : '';
    import('./notification-routes').then(({ getNotificationHref }) => {
      window.location.assign(getNotificationHref({ type, data }));
    });
  });

  window.__onesignalClickHandlerSet = true;
}

export function initOneSignalSdk() {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId || typeof window === 'undefined' || window.__onesignalUnavailable) return;

  const scriptId = 'onesignal-sdk';
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    document.head.appendChild(script);
  }

  if (window.__onesignalInitialized) return;

  runWhenReady(async (OneSignal) => {
    if (window.__onesignalInitialized || window.__onesignalUnavailable) return;
    try {
      await OneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
      });
      setupPushClickNavigation(OneSignal);
      window.__onesignalInitialized = true;
    } catch (error) {
      window.__onesignalUnavailable = true;
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[OneSignal] Push disabled on this origin. Add this URL under OneSignal → Settings → Web → Allowed Origins:',
          window.location.origin,
          error,
        );
      }
    }
  });
}
