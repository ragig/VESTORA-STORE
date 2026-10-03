"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCartStore = create(persist((set) => ({
  items: [],
  isOpen: false,
  addItem: (product) => set((state) => {
    const existing = state.items.find((item) => item.id === product.id && item.selectedSize === product.selectedSize);
    return { items: existing ? state.items.map((item) => item.id === product.id && item.selectedSize === product.selectedSize ? { ...item, quantity: item.quantity + 1 } : item) : [...state.items, { ...product, quantity: 1 }], isOpen: true };
  }),
  buyNow: (product) => set({ items: [{ ...product, quantity: 1 }], isOpen: false }),
  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  updateQuantity: (id, quantity, selectedSize) => set((state) => ({ items: quantity < 1 ? state.items.filter((item) => !(item.id === id && item.selectedSize === selectedSize)) : state.items.map((item) => item.id === id && item.selectedSize === selectedSize ? { ...item, quantity } : item) })),
  clearCart: () => set({ items: [] }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
}), { name: "vestora-cart" }));
