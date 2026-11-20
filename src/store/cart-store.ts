"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartItem = {
  /** Kunci unik baris keranjang: menuId + catatan (menu sama dengan catatan beda = baris berbeda). */
  key: string;
  menuId: string;
  name: string;
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
  notes: string;
};

type CartState = {
  /** Meja yang sedang terkunci untuk sesi pemesanan ini. */
  tableId: string | null;
  items: CartItem[];
  /** Pesanan terakhir per meja, agar pelanggan bisa kembali ke halaman status. */
  lastOrders: Record<string, { orderId: string; orderNumber: string; createdAt: string }>;

  /** Kunci meja; jika berbeda dari meja sebelumnya, keranjang dikosongkan. */
  bindTable: (tableId: string) => void;
  addItem: (item: Omit<CartItem, "key" | "quantity">, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  removeMenus: (menuIds: string[]) => void;
  syncPrices: (prices: Record<string, number>) => void;
  clear: () => void;
  setLastOrder: (tableId: string, order: { orderId: string; orderNumber: string }) => void;
};

const makeKey = (menuId: string, notes: string) => `${menuId}::${notes.trim().toLowerCase()}`;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      tableId: null,
      items: [],
      lastOrders: {},

      bindTable: (tableId) =>
        set((state) => (state.tableId === tableId ? state : { tableId, items: [] })),

      addItem: (item, quantity = 1) =>
        set((state) => {
          const notes = item.notes.trim();
          const key = makeKey(item.menuId, notes);
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, quantity: Math.min(50, i.quantity + quantity) } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, notes, key, quantity }] };
        }),

      setQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.key !== key)
              : state.items.map((i) => (i.key === key ? { ...i, quantity: Math.min(50, quantity) } : i)),
        })),

      removeItem: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

      removeMenus: (menuIds) =>
        set((state) => ({ items: state.items.filter((i) => !menuIds.includes(i.menuId)) })),

      syncPrices: (prices) =>
        set((state) => {
          let changed = false;
          const items = state.items.map((i) => {
            const price = prices[i.menuId];
            if (price != null && price !== i.unitPrice) {
              changed = true;
              return { ...i, unitPrice: price };
            }
            return i;
          });
          return changed ? { items } : state;
        }),

      clear: () => set({ items: [] }),

      setLastOrder: (tableId, order) =>
        set((state) => ({
          lastOrders: {
            ...state.lastOrders,
            [tableId]: { ...order, createdAt: new Date().toISOString() },
          },
        })),
    }),
    {
      name: "kopi-teras-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const selectCartCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0);
export const selectCartTotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
