import type { MenuCategory, OrderStatusValue } from "./constants";

/** Bentuk data menu yang dikirim ke client (tanggal sudah diserialisasi). */
export type MenuDTO = {
  id: string;
  name: string;
  description: string | null;
  category: MenuCategory | string;
  price: number;
  promoPrice: number | null;
  imageUrl: string | null;
  isAvailable: boolean;
};

export type TableDTO = {
  id: string;
  tableNumber: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  _count?: { orders: number };
};

export type OrderItemDTO = {
  id: string;
  menuId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
};

export type OrderDTO = {
  id: string;
  orderNumber: string;
  status: OrderStatusValue;
  customerName: string;
  customerEmail: string | null;
  totalAmount: number;
  paymentProofUrl: string;
  createdAt: string;
  updatedAt: string;
  table: { id: string; tableNumber: string; location: string };
  items: OrderItemDTO[];
};

/** Versi publik (untuk halaman tracking pelanggan) — tanpa email & bukti bayar. */
export type PublicOrderDTO = Omit<OrderDTO, "customerEmail" | "paymentProofUrl">;
