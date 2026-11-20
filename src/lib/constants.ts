/**
 * Konstanta & aturan status pesanan. File ini sengaja TIDAK mengimpor
 * `@prisma/client` agar aman dipakai di Client Component maupun server.
 */

export const ORDER_STATUSES = [
  "PENDING_VERIFICATION",
  "PROCESSING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const ROLES = ["ADMIN", "CASHIER", "KITCHEN"] as const;
export type RoleValue = (typeof ROLES)[number];

export const ROLE_LABEL: Record<RoleValue, string> = {
  ADMIN: "Admin / Manajer",
  CASHIER: "Kasir",
  KITCHEN: "Dapur",
};

export const ROLE_HOME: Record<RoleValue, string> = {
  ADMIN: "/dashboard/admin",
  CASHIER: "/dashboard/cashier",
  KITCHEN: "/dashboard/kitchen",
};

export const ORDER_STATUS_META: Record<
  OrderStatusValue,
  { label: string; customerLabel: string; description: string; badgeClass: string }
> = {
  PENDING_VERIFICATION: {
    label: "Menunggu Verifikasi",
    customerLabel: "Menunggu Verifikasi Kasir",
    description: "Bukti pembayaranmu sedang dicek oleh kasir.",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  PROCESSING: {
    label: "Diproses",
    customerLabel: "Pesanan Sedang Dibuat",
    description: "Pembayaran valid! Barista & dapur sedang menyiapkan pesananmu.",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
  },
  READY: {
    label: "Siap Diambil",
    customerLabel: "Pesanan Siap Diambil",
    description: "Silakan ambil pesananmu di konter Kopi Teras.",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  COMPLETED: {
    label: "Selesai",
    customerLabel: "Pesanan Selesai",
    description: "Terima kasih! Selamat menikmati.",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-200",
  },
  CANCELLED: {
    label: "Dibatalkan",
    customerLabel: "Pesanan Dibatalkan",
    description:
      "Bukti pembayaran tidak valid atau kedaluwarsa. Silakan hubungi kasir untuk bantuan.",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
  },
};

/**
 * Transisi status yang diizinkan beserta role yang boleh melakukannya.
 */
export const ORDER_TRANSITIONS: Record<
  OrderStatusValue,
  Partial<Record<OrderStatusValue, RoleValue[]>>
> = {
  PENDING_VERIFICATION: {
    PROCESSING: ["CASHIER", "ADMIN"],
    CANCELLED: ["CASHIER", "ADMIN"],
  },
  PROCESSING: {
    READY: ["KITCHEN", "ADMIN"],
    CANCELLED: ["CASHIER", "ADMIN"],
  },
  READY: {
    COMPLETED: ["CASHIER", "KITCHEN", "ADMIN"],
  },
  COMPLETED: {},
  CANCELLED: {},
};

export function canTransition(from: OrderStatusValue, to: OrderStatusValue, role: RoleValue) {
  return ORDER_TRANSITIONS[from]?.[to]?.includes(role) ?? false;
}

export function isOrderStatus(value: unknown): value is OrderStatusValue {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export const MENU_CATEGORIES = ["Coffee", "Non-Coffee", "Snack", "Main Course", "Promo"] as const;
export type MenuCategory = (typeof MENU_CATEGORIES)[number];

export const TABLE_LOCATIONS = ["Indoor", "Outdoor"] as const;
