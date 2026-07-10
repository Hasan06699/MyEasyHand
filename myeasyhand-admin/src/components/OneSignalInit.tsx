'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';

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

const SUBSCRIPTION_STORAGE_KEY = 'onesignalSubscriptionId';

function runWhenReady(callback: (OneSignal: OneSignalSDK) => void | Promise<void>) {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    if (window.__onesignalUnavailable) return;
    try {
      await callback(OneSignal);
    } catch {
      // ignore push errors
    }
  });
}

function setupPushClickNavigation(OneSignal: OneSignalSDK) {
  if (window.__onesignalClickHandlerSet || !OneSignal.Notifications) return;

  OneSignal.Notifications.addEventListener('click', (event) => {
    const data = event.notification.additionalData ?? {};
    const type = typeof data.type === 'string' ? data.type : '';
    import('@/lib/notification-routes').then(({ getNotificationHref }) => {
      window.location.assign(getNotificationHref({ type, data }));
    });
  });

  window.__onesignalClickHandlerSet = true;
}

async function registerAdminDevice(OneSignal: OneSignalSDK) {
  try {
    if (!OneSignal.User.PushSubscription.optedIn) {
      await OneSignal.User.PushSubscription.optIn();
    }
  } catch {
    // ignore
  }
  const subscriptionId = OneSignal.User.PushSubscription.id ?? undefined;
  try {
    await authApi.registerDevice({
      platform: 'admin_web',
      onesignalSubscriptionId: subscriptionId,
      deviceLabel: typeof navigator !== 'undefined' ? navigator.platform : undefined,
    });
    if (subscriptionId) sessionStorage.setItem(SUBSCRIPTION_STORAGE_KEY, subscriptionId);
  } catch {
    // non-blocking
  }
}

export default function OneSignalInit() {
  const { user, isAuthenticated } = useAuthStore();
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const loggedInUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!appId) return;

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
  }, [appId]);

  useEffect(() => {
    if (!appId) return;

    if (isAuthenticated && user?.id) {
      if (loggedInUserIdRef.current === user.id) return;

      runWhenReady(async (OneSignal) => {
        await OneSignal.login(user.id);
        try {
          await OneSignal.Notifications?.requestPermission();
        } catch {
          // ignore
        }
        await registerAdminDevice(OneSignal);
        loggedInUserIdRef.current = user.id;
      });
      return;
    }

    if (loggedInUserIdRef.current) {
      const subscriptionId = sessionStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      runWhenReady(async (OneSignal) => {
        if (subscriptionId) {
          try {
            await authApi.unregisterDevice(subscriptionId);
          } catch {
            // ignore
          }
        }
        await OneSignal.logout();
        sessionStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
        loggedInUserIdRef.current = null;
      });
    }
  }, [appId, isAuthenticated, user?.id]);

  return null;
}
