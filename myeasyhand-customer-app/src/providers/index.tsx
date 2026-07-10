import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { store } from '@/store';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { bootstrapAuth } from '@/store/slices/auth.slice';
import { useAppDispatch } from '@/store/hooks';
import {
  handleCartLogout,
  initCartSync,
  startRealtimeCartSync,
  stopRealtimeCartSync,
  syncCartWithServer,
} from '@/lib/cart-sync';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let unsubscribeCart: (() => void) | undefined;
    let wasAuthenticated = store.getState().auth.isAuthenticated;

    void (async () => {
      await dispatch(bootstrapAuth()).unwrap().catch(() => undefined);
      await syncCartWithServer(dispatch, store.getState);
      wasAuthenticated = store.getState().auth.isAuthenticated;
      if (wasAuthenticated) {
        startRealtimeCartSync(dispatch, store.getState);
      }
      unsubscribeCart = initCartSync(dispatch, store.getState, store.subscribe);
    })();

    const unsubscribeAuth = store.subscribe(() => {
      const isAuthenticated = store.getState().auth.isAuthenticated;

      if (isAuthenticated && !wasAuthenticated) {
        void syncCartWithServer(dispatch, store.getState).then(() => {
          startRealtimeCartSync(dispatch, store.getState);
        });
      }

      if (!isAuthenticated && wasAuthenticated) {
        void handleCartLogout(dispatch);
      }

      wasAuthenticated = isAuthenticated;
    });

    return () => {
      unsubscribeCart?.();
      unsubscribeAuth();
      stopRealtimeCartSync();
    };
  }, [dispatch]);

  return <>{children}</>;
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthBootstrap>
              <ThemedStatusBar />
              {children}
            </AuthBootstrap>
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
