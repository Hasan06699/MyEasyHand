import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';
import type { AppDispatch, RootState } from '@/store';
import { cartApi } from '@/services/api/cart';
import { getAccessToken } from '@/services/api';
import { hydrateCart, type CartState } from '@/store/slices/cart.slice';

const GUEST_CART_KEY = 'myeasyhand-guest-cart';
const PULL_INTERVAL_MS = 10000;
const PUSH_DEBOUNCE_MS = 300;

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pullInterval: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: { remove: () => void } | null = null;
let eventAbort: AbortController | null = null;
let isHydrating = false;
let isSyncing = false;

let activeDispatch: AppDispatch | null = null;
let activeGetState: (() => RootState) | null = null;

function serializeCartState(cart: CartState) {
  return {
    items: cart.items.map((item) => ({
      serviceId: item.serviceId,
      quantity: item.quantity,
      ...(item.notes ? { notes: item.notes } : {}),
    })),
    scheduledAt: cart.scheduledAt || undefined,
    notes: cart.notes || undefined,
    couponCode: cart.couponCode || undefined,
    cityName: cart.cityName || undefined,
    areaName: cart.areaName || undefined,
    clientUpdatedAt: cart.updatedAt || undefined,
  };
}

function applyServerCart(dispatch: AppDispatch, data: Partial<CartState> & { items: CartState['items'] }) {
  isHydrating = true;
  dispatch(
    hydrateCart({
      items: data.items ?? [],
      scheduledAt: data.scheduledAt ?? '',
      notes: data.notes ?? '',
      couponCode: data.couponCode ?? '',
      cityName: data.cityName ?? '',
      areaName: data.areaName ?? '',
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    }),
  );
  isHydrating = false;
}

export async function saveGuestCart(cart: CartState) {
  await AsyncStorage.setItem(
    GUEST_CART_KEY,
    JSON.stringify({
      items: cart.items,
      scheduledAt: cart.scheduledAt,
      notes: cart.notes,
      couponCode: cart.couponCode,
      cityName: cart.cityName,
      areaName: cart.areaName,
      updatedAt: cart.updatedAt,
    }),
  );
}

export async function loadGuestCart(dispatch: AppDispatch) {
  const raw = await AsyncStorage.getItem(GUEST_CART_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as Partial<CartState>;
    applyServerCart(dispatch, {
      items: parsed.items ?? [],
      scheduledAt: parsed.scheduledAt ?? '',
      notes: parsed.notes ?? '',
      couponCode: parsed.couponCode ?? '',
      cityName: parsed.cityName ?? '',
      areaName: parsed.areaName ?? '',
      updatedAt: parsed.updatedAt ?? null,
    });
  } catch {
    await AsyncStorage.removeItem(GUEST_CART_KEY);
  }
}

export function scheduleCartPush(dispatch: AppDispatch, getState: () => RootState) {
  if (isHydrating || isSyncing) return;

  const { isAuthenticated } = getState().auth;
  const cart = getState().cart;

  if (!isAuthenticated) {
    void saveGuestCart(cart);
    return;
  }

  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void pushCartToServer(dispatch, getState);
  }, PUSH_DEBOUNCE_MS);
}

export async function pushCartToServer(dispatch: AppDispatch, getState: () => RootState) {
  if (isHydrating || isSyncing) return;
  const token = await getAccessToken();
  if (!token) return;

  isSyncing = true;
  try {
    const cart = getState().cart;
    const res = await cartApi.save(serializeCartState(cart));
    applyServerCart(dispatch, {
      items: res.data.data.items ?? [],
      scheduledAt: res.data.data.scheduledAt ?? '',
      notes: res.data.data.notes ?? '',
      couponCode: res.data.data.couponCode ?? '',
      cityName: res.data.data.cityName ?? '',
      areaName: res.data.data.areaName ?? '',
      updatedAt: res.data.data.updatedAt ?? new Date().toISOString(),
    });
  } catch {
    // keep local cart
  } finally {
    isSyncing = false;
  }
}

export async function pullCartFromServer(dispatch: AppDispatch, getState: () => RootState) {
  const token = await getAccessToken();
  if (!token) return;
  if (isHydrating || isSyncing) return;

  try {
    const local = getState().cart;
    const res = await cartApi.get();
    const server = res.data.data;

    const localUpdated = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
    const serverUpdated = server.updatedAt ? new Date(server.updatedAt).getTime() : 0;

    if (serverUpdated > localUpdated) {
      applyServerCart(dispatch, {
        items: server.items ?? [],
        scheduledAt: server.scheduledAt ?? '',
        notes: server.notes ?? '',
        couponCode: server.couponCode ?? '',
        cityName: server.cityName ?? '',
        areaName: server.areaName ?? '',
        updatedAt: server.updatedAt ?? new Date().toISOString(),
      });
    }
  } catch {
    // keep local cart
  }
}

export async function clearServerCart() {
  const token = await getAccessToken();
  if (!token) return;
  try {
    await cartApi.clear();
  } catch {
    // ignore
  }
}

export async function syncCartWithServer(dispatch: AppDispatch, getState: () => RootState) {
  const token = await getAccessToken();
  if (!token) {
    await loadGuestCart(dispatch);
    return;
  }

  isSyncing = true;
  try {
    const local = getState().cart;
    const res = await cartApi.get();
    const server = res.data.data;

    const localUpdated = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
    const serverUpdated = server.updatedAt ? new Date(server.updatedAt).getTime() : 0;
    const localHasItems = local.items.length > 0;
    const serverHasItems = (server.items?.length ?? 0) > 0;

    if (serverHasItems && (!localHasItems || serverUpdated >= localUpdated)) {
      applyServerCart(dispatch, {
        items: server.items ?? [],
        scheduledAt: server.scheduledAt ?? '',
        notes: server.notes ?? '',
        couponCode: server.couponCode ?? '',
        cityName: server.cityName ?? '',
        areaName: server.areaName ?? '',
        updatedAt: server.updatedAt ?? new Date().toISOString(),
      });
      await AsyncStorage.removeItem(GUEST_CART_KEY);
      return;
    }

    if (localHasItems && (!serverHasItems || localUpdated > serverUpdated)) {
      const saveRes = await cartApi.save(serializeCartState(local));
      applyServerCart(dispatch, {
        items: saveRes.data.data.items ?? [],
        scheduledAt: saveRes.data.data.scheduledAt ?? '',
        notes: saveRes.data.data.notes ?? '',
        couponCode: saveRes.data.data.couponCode ?? '',
        cityName: saveRes.data.data.cityName ?? '',
        areaName: saveRes.data.data.areaName ?? '',
        updatedAt: saveRes.data.data.updatedAt ?? new Date().toISOString(),
      });
      await AsyncStorage.removeItem(GUEST_CART_KEY);
    }
  } catch {
    // keep local cart
  } finally {
    isSyncing = false;
  }
}

function handleAppStateChange(nextState: AppStateStatus) {
  if (nextState !== 'active' || !activeDispatch || !activeGetState) return;
  void pullCartFromServer(activeDispatch, activeGetState);
}

async function readCartEventStream(token: string, signal: AbortSignal, onUpdate: () => void) {
  const response = await fetch(`${API_URL}/cart/events`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    signal,
  });

  if (!response.ok || !response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      const dataLine = part
        .split('\n')
        .find((line) => line.startsWith('data: '));
      if (!dataLine) continue;
      const payload = dataLine.slice(6);
      if (payload && !payload.includes('"connected"')) {
        onUpdate();
      }
    }
  }
}

function connectCartEventStream(dispatch: AppDispatch, getState: () => RootState) {
  eventAbort?.abort();
  eventAbort = new AbortController();
  const signal = eventAbort.signal;

  void (async () => {
    while (!signal.aborted) {
      const token = await getAccessToken();
      if (!token) break;

      try {
        await readCartEventStream(token, signal, () => {
          void pullCartFromServer(dispatch, getState);
        });
      } catch {
        // reconnect below
      }

      if (signal.aborted) break;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  })();
}

export function startRealtimeCartSync(dispatch: AppDispatch, getState: () => RootState) {
  stopRealtimeCartSync();
  activeDispatch = dispatch;
  activeGetState = getState;

  void pullCartFromServer(dispatch, getState);
  connectCartEventStream(dispatch, getState);
  pullInterval = setInterval(() => {
    void pullCartFromServer(dispatch, getState);
  }, PULL_INTERVAL_MS);

  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
}

export function stopRealtimeCartSync() {
  eventAbort?.abort();
  eventAbort = null;
  if (pullInterval) {
    clearInterval(pullInterval);
    pullInterval = null;
  }
  appStateSubscription?.remove();
  appStateSubscription = null;
  activeDispatch = null;
  activeGetState = null;
}

export async function handleCartLogout(dispatch: AppDispatch) {
  stopRealtimeCartSync();
  await loadGuestCart(dispatch);
}

export function initCartSync(
  dispatch: AppDispatch,
  getState: () => RootState,
  subscribe: (listener: () => void) => () => void,
) {
  let previousUpdatedAt = getState().cart.updatedAt;

  return subscribe(() => {
    const nextUpdatedAt = getState().cart.updatedAt;
    if (nextUpdatedAt === previousUpdatedAt) return;
    previousUpdatedAt = nextUpdatedAt;
    scheduleCartPush(dispatch, getState);
  });
}
