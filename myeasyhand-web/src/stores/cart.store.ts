import { create } from 'zustand';
import type { CartItem, Service } from '@/types';
import { getBusinessId } from '@/lib/utils';

interface CartState {
  items: CartItem[];
  scheduledAt: string;
  notes: string;
  couponCode: string;
  cityName: string;
  areaName: string;
  paymentMethod: 'online' | 'cash';
  updatedAt: string | null;
  addItem: (service: Service, quantity?: number) => void;
  removeItem: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  clear: () => void;
  replaceFromServer: (data: {
    items: CartItem[];
    scheduledAt?: string;
    notes?: string;
    couponCode?: string;
    cityName?: string;
    areaName?: string;
    updatedAt?: string | null;
  }) => void;
  setScheduledAt: (date: string) => void;
  setNotes: (notes: string) => void;
  setCouponCode: (code: string) => void;
  setLocation: (city: string, area: string) => void;
  setPaymentMethod: (method: 'online' | 'cash') => void;
  subtotal: () => number;
  itemCount: () => number;
  businessGroups: () => Record<string, CartItem[]>;
}

function touchUpdatedAt() {
  return new Date().toISOString();
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  scheduledAt: '',
  notes: '',
  couponCode: '',
  cityName: '',
  areaName: '',
  paymentMethod: 'online',
  updatedAt: null,

  addItem: (service, quantity = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.serviceId === service._id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.serviceId === service._id ? { ...i, quantity: i.quantity + quantity } : i,
          ),
          updatedAt: touchUpdatedAt(),
        };
      }
      return {
        items: [...state.items, { serviceId: service._id, service, quantity, notes: '' }],
        updatedAt: touchUpdatedAt(),
      };
    });
  },

  removeItem: (serviceId) =>
    set((state) => ({ items: state.items.filter((i) => i.serviceId !== serviceId), updatedAt: touchUpdatedAt() })),

  updateQuantity: (serviceId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.serviceId !== serviceId)
          : state.items.map((i) => (i.serviceId === serviceId ? { ...i, quantity } : i)),
      updatedAt: touchUpdatedAt(),
    })),

  clear: () =>
    set({
      items: [],
      scheduledAt: '',
      notes: '',
      couponCode: '',
      paymentMethod: 'online',
      updatedAt: touchUpdatedAt(),
    }),

  replaceFromServer: (data) =>
    set({
      items: data.items ?? [],
      scheduledAt: data.scheduledAt ?? '',
      notes: data.notes ?? '',
      couponCode: data.couponCode ?? '',
      cityName: data.cityName ?? '',
      areaName: data.areaName ?? '',
      updatedAt: data.updatedAt ?? touchUpdatedAt(),
    }),

  setScheduledAt: (scheduledAt) => set({ scheduledAt, updatedAt: touchUpdatedAt() }),
  setNotes: (notes) => set({ notes, updatedAt: touchUpdatedAt() }),
  setCouponCode: (couponCode) => set({ couponCode, updatedAt: touchUpdatedAt() }),
  setLocation: (cityName, areaName) => set({ cityName, areaName, updatedAt: touchUpdatedAt() }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod, updatedAt: touchUpdatedAt() }),

  subtotal: () =>
    get().items.reduce((sum, item) => {
      const price = item.service.salePrice ?? item.service.basePrice ?? 0;
      return sum + price * item.quantity;
    }, 0),

  itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

  businessGroups: () => {
    const groups: Record<string, CartItem[]> = {};
    for (const item of get().items) {
      const bid = getBusinessId(item.service);
      if (!groups[bid]) groups[bid] = [];
      groups[bid].push(item);
    }
    return groups;
  },
}));
