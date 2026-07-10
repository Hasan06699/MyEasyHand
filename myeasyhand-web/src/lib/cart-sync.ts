import { cartApi } from '@/lib/api/cart';
import { useCartStore } from '@/stores/cart.store';

const GUEST_CART_KEY = 'myeasyhand-guest-cart';
const PULL_INTERVAL_MS = 10000;
const PUSH_DEBOUNCE_MS = 300;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5051/api/v1';

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pullInterval: ReturnType<typeof setInterval> | null = null;
let eventAbort: AbortController | null = null;
let isHydrating = false;
let isSyncing = false;

function isLoggedIn() {
  return typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
}

function getLocalPayload() {
  const state = useCartStore.getState();
  return {
    items: state.items.map((item) => ({
      serviceId: item.serviceId,
      quantity: item.quantity,
      ...(item.notes ? { notes: item.notes } : {}),
    })),
    scheduledAt: state.scheduledAt || undefined,
    notes: state.notes || undefined,
    couponCode: state.couponCode || undefined,
    cityName: state.cityName || undefined,
    areaName: state.areaName || undefined,
    clientUpdatedAt: state.updatedAt || undefined,
  };
}

function applyServerCart(
  data: {
    items: ReturnType<typeof useCartStore.getState>['items'];
    scheduledAt?: string;
    notes?: string;
    couponCode?: string;
    cityName?: string;
    areaName?: string;
    updatedAt?: string | null;
  },
) {
  isHydrating = true;
  useCartStore.getState().replaceFromServer({
    items: data.items ?? [],
    scheduledAt: data.scheduledAt ?? '',
    notes: data.notes ?? '',
    couponCode: data.couponCode ?? '',
    cityName: data.cityName ?? '',
    areaName: data.areaName ?? '',
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  });
  isHydrating = false;
}

export function saveGuestCart() {
  if (typeof window === 'undefined') return;
  const state = useCartStore.getState();
  localStorage.setItem(
    GUEST_CART_KEY,
    JSON.stringify({
      items: state.items,
      scheduledAt: state.scheduledAt,
      notes: state.notes,
      couponCode: state.couponCode,
      cityName: state.cityName,
      areaName: state.areaName,
      updatedAt: state.updatedAt,
    }),
  );
}

export function loadGuestCart() {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(GUEST_CART_KEY) ?? localStorage.getItem('myeasyhand-cart');
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as ReturnType<typeof useCartStore.getState>;
    applyServerCart({
      items: parsed.items ?? [],
      scheduledAt: parsed.scheduledAt,
      notes: parsed.notes,
      couponCode: parsed.couponCode,
      cityName: parsed.cityName,
      areaName: parsed.areaName,
      updatedAt: parsed.updatedAt,
    });
  } catch {
    localStorage.removeItem(GUEST_CART_KEY);
  }
}

export function scheduleCartPush() {
  if (isHydrating || isSyncing) return;
  if (typeof window === 'undefined') return;

  if (!isLoggedIn()) {
    saveGuestCart();
    return;
  }

  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void pushCartToServer();
  }, PUSH_DEBOUNCE_MS);
}

export async function pushCartToServer() {
  if (isHydrating || isSyncing) return;
  if (!isLoggedIn()) return;

  isSyncing = true;
  try {
    const res = await cartApi.save(getLocalPayload());
    applyServerCart({
      ...res.data.data,
      updatedAt: res.data.data.updatedAt ?? new Date().toISOString(),
    });
  } catch {
    // keep local cart if sync fails
  } finally {
    isSyncing = false;
  }
}

export async function pullCartFromServer() {
  if (!isLoggedIn()) return;
  if (isHydrating || isSyncing) return;

  try {
    const local = useCartStore.getState();
    const res = await cartApi.get();
    const server = res.data.data;

    const localUpdated = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
    const serverUpdated = server.updatedAt ? new Date(server.updatedAt).getTime() : 0;

    if (serverUpdated > localUpdated) {
      applyServerCart(server);
    }
  } catch {
    // keep local cart
  }
}

export async function clearServerCart() {
  if (!isLoggedIn()) return;
  try {
    await cartApi.clear();
  } catch {
    // ignore
  }
}

export async function syncCartWithServer() {
  if (!isLoggedIn()) {
    loadGuestCart();
    return;
  }

  isSyncing = true;
  try {
    const local = useCartStore.getState();
    const res = await cartApi.get();
    const server = res.data.data;

    const localUpdated = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
    const serverUpdated = server.updatedAt ? new Date(server.updatedAt).getTime() : 0;
    const localHasItems = local.items.length > 0;
    const serverHasItems = (server.items?.length ?? 0) > 0;

    if (serverHasItems && (!localHasItems || serverUpdated >= localUpdated)) {
      applyServerCart(server);
      localStorage.removeItem(GUEST_CART_KEY);
      localStorage.removeItem('myeasyhand-cart');
      return;
    }

    if (localHasItems && (!serverHasItems || localUpdated > serverUpdated)) {
      const saveRes = await cartApi.save(getLocalPayload());
      applyServerCart({
        ...saveRes.data.data,
        updatedAt: saveRes.data.data.updatedAt ?? new Date().toISOString(),
      });
      localStorage.removeItem(GUEST_CART_KEY);
      localStorage.removeItem('myeasyhand-cart');
    }
  } catch {
    // keep local cart
  } finally {
    isSyncing = false;
  }
}

function onWindowFocus() {
  if (isLoggedIn()) void pullCartFromServer();
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible' && isLoggedIn()) {
    void pullCartFromServer();
  }
}

async function readCartEventStream(signal: AbortSignal, onUpdate: () => void) {
  const token = localStorage.getItem('accessToken');
  if (!token) return;

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

function connectCartEventStream() {
  if (typeof window === 'undefined' || !isLoggedIn()) return;

  eventAbort?.abort();
  eventAbort = new AbortController();
  const signal = eventAbort.signal;

  void (async () => {
    while (!signal.aborted && isLoggedIn()) {
      try {
        await readCartEventStream(signal, () => {
          void pullCartFromServer();
        });
      } catch {
        // reconnect below
      }

      if (signal.aborted || !isLoggedIn()) break;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  })();
}

export function startRealtimeCartSync() {
  stopRealtimeCartSync();
  if (!isLoggedIn()) return;

  void pullCartFromServer();
  connectCartEventStream();
  pullInterval = setInterval(() => {
    void pullCartFromServer();
  }, PULL_INTERVAL_MS);

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', onWindowFocus);
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }
}

export function stopRealtimeCartSync() {
  eventAbort?.abort();
  eventAbort = null;
  if (pullInterval) {
    clearInterval(pullInterval);
    pullInterval = null;
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('focus', onWindowFocus);
  }
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }
}

export function handleCartLogout() {
  stopRealtimeCartSync();
  loadGuestCart();
}
