'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { initOneSignalSdk, linkOneSignalUser, unlinkOneSignalUser } from '@/lib/onesignal';

export default function OneSignalInit() {
  const { user, isAuthenticated } = useAuthStore();
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const linkedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!appId) return;
    initOneSignalSdk();
  }, [appId]);

  useEffect(() => {
    if (!appId) return;

    if (isAuthenticated && user?.id) {
      if (linkedUserIdRef.current === user.id) return;
      linkOneSignalUser(user.id);
      linkedUserIdRef.current = user.id;
      return;
    }

    if (linkedUserIdRef.current) {
      unlinkOneSignalUser();
      linkedUserIdRef.current = null;
    }
  }, [appId, isAuthenticated, user?.id]);

  return null;
}
