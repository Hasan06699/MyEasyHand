'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import {
  handleCartLogout,
  scheduleCartPush,
  startRealtimeCartSync,
  stopRealtimeCartSync,
  syncCartWithServer,
} from '@/lib/cart-sync';

export function CartSyncInit() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      void syncCartWithServer().then(() => {
        startRealtimeCartSync();
      });
      return () => {
        stopRealtimeCartSync();
      };
    }

    stopRealtimeCartSync();
    handleCartLogout();
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribe = useCartStore.subscribe((state, prev) => {
      if (state.updatedAt === prev.updatedAt) return;
      scheduleCartPush();
    });
    return unsubscribe;
  }, []);

  return null;
}
