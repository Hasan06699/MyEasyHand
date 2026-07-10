import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CartItem, Service } from '@/types';
import { getBusinessId, getServicePrice } from '@/lib/utils';

export interface CartState {
  items: CartItem[];
  scheduledAt: string;
  notes: string;
  couponCode: string;
  cityName: string;
  areaName: string;
  updatedAt: string | null;
}

const initialState: CartState = {
  items: [],
  scheduledAt: '',
  notes: '',
  couponCode: '',
  cityName: '',
  areaName: '',
  updatedAt: null,
};

function touchUpdatedAt() {
  return new Date().toISOString();
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<{ service: Service; quantity?: number }>) {
      const { service, quantity = 1 } = action.payload;
      const existing = state.items.find((i) => i.serviceId === service._id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ serviceId: service._id, service, quantity, notes: '' });
      }
      state.updatedAt = touchUpdatedAt();
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.serviceId !== action.payload);
      state.updatedAt = touchUpdatedAt();
    },
    updateQuantity(state, action: PayloadAction<{ serviceId: string; quantity: number }>) {
      const { serviceId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((i) => i.serviceId !== serviceId);
      } else {
        const item = state.items.find((i) => i.serviceId === serviceId);
        if (item) item.quantity = quantity;
      }
      state.updatedAt = touchUpdatedAt();
    },
    clearCart(state) {
      state.items = [];
      state.scheduledAt = '';
      state.notes = '';
      state.couponCode = '';
      state.updatedAt = touchUpdatedAt();
    },
    setScheduledAt(state, action: PayloadAction<string>) {
      state.scheduledAt = action.payload;
      state.updatedAt = touchUpdatedAt();
    },
    setNotes(state, action: PayloadAction<string>) {
      state.notes = action.payload;
      state.updatedAt = touchUpdatedAt();
    },
    setCouponCode(state, action: PayloadAction<string>) {
      state.couponCode = action.payload;
      state.updatedAt = touchUpdatedAt();
    },
    setLocation(state, action: PayloadAction<{ cityName: string; areaName: string }>) {
      state.cityName = action.payload.cityName;
      state.areaName = action.payload.areaName;
      state.updatedAt = touchUpdatedAt();
    },
    hydrateCart(state, action: PayloadAction<CartState>) {
      state.items = action.payload.items;
      state.scheduledAt = action.payload.scheduledAt;
      state.notes = action.payload.notes;
      state.couponCode = action.payload.couponCode;
      state.cityName = action.payload.cityName;
      state.areaName = action.payload.areaName;
      state.updatedAt = action.payload.updatedAt;
    },
    touchCartUpdatedAt(state) {
      state.updatedAt = touchUpdatedAt();
    },
  },
});

export const {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  setScheduledAt,
  setNotes,
  setCouponCode,
  setLocation,
  hydrateCart,
  touchCartUpdatedAt,
} = cartSlice.actions;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + getServicePrice(item.service) * item.quantity, 0);
export const selectCartBusinessGroups = (state: { cart: CartState }) => {
  const groups: Record<string, CartItem[]> = {};
  for (const item of state.cart.items) {
    const bid = getBusinessId(item.service);
    if (!groups[bid]) groups[bid] = [];
    groups[bid].push(item);
  }
  return groups;
};

export default cartSlice.reducer;
