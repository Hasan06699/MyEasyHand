'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SelectedCity {
  _id: string;
  name: string;
  slug: string;
  state?: string;
}

export interface CustomerAddress {
  label?: string;
  line1: string;
  area?: string;
  city: string;
  cityId?: string;
  state?: string;
  pincode?: string;
}

interface CityState {
  city: SelectedCity | null;
  address: CustomerAddress | null;
  setCity: (city: SelectedCity | null) => void;
  setAddress: (address: CustomerAddress | null) => void;
  clear: () => void;
}

export const useCityStore = create<CityState>()(
  persist(
    (set) => ({
      city: null,
      address: null,
      setCity: (city) => set({ city }),
      setAddress: (address) =>
        set((state) => ({
          address,
          // Keep city in sync when address includes cityId
          city:
            address?.cityId && address.city
              ? {
                  _id: address.cityId,
                  name: address.city,
                  slug: state.city?.slug || address.city.toLowerCase().replace(/\s+/g, '-'),
                  state: address.state,
                }
              : state.city,
        })),
      clear: () => set({ city: null, address: null }),
    }),
    { name: 'myeasyhand-city' },
  ),
);
