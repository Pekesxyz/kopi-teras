import { z } from "zod";
import { MENU_CATEGORIES, TABLE_LOCATIONS } from "./constants";

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const createOrderSchema = z.object({
  tableId: z.string().min(1, "Meja tidak valid."),
  customerName: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi.")
    .max(60, "Nama maksimal 60 karakter."),
  customerEmail: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Format email tidak valid."),
  paymentProofUrl: z
    .string()
    .min(1, "Bukti pembayaran wajib diunggah.")
    .startsWith("/api/files/payments/", "Bukti pembayaran tidak valid."),
  items: z
    .array(
      z.object({
        menuId: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
        notes: optionalTrimmed(200),
      }),
    )
    .min(1, "Keranjang masih kosong.")
    .max(50),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING_VERIFICATION", "PROCESSING", "READY", "COMPLETED", "CANCELLED"]),
});

const imageUrlSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine(
    (v) => v === null || v.startsWith("/") || /^https?:\/\//i.test(v),
    "URL gambar harus diawali http(s):// atau /",
  );

export const menuSchema = z
  .object({
    name: z.string().trim().min(1, "Nama menu wajib diisi.").max(100),
    description: optionalTrimmed(1000),
    category: z.enum(MENU_CATEGORIES, { message: "Kategori tidak valid." }),
    price: z.number().int().min(0, "Harga tidak boleh negatif.").max(100_000_000),
    promoPrice: z.number().int().min(0).max(100_000_000).nullable().optional(),
    imageUrl: imageUrlSchema,
    isAvailable: z.boolean().optional(),
  })
  .refine((d) => d.promoPrice == null || d.promoPrice < d.price, {
    message: "Harga promo harus lebih kecil dari harga normal.",
    path: ["promoPrice"],
  });

export const menuPatchSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: optionalTrimmed(1000),
  category: z.enum(MENU_CATEGORIES).optional(),
  price: z.number().int().min(0).max(100_000_000).optional(),
  promoPrice: z.number().int().min(0).max(100_000_000).nullable().optional(),
  imageUrl: imageUrlSchema,
  isAvailable: z.boolean().optional(),
});

export const tableSchema = z.object({
  tableNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Nomor meja wajib diisi.")
    .max(20)
    .regex(/^[A-Z0-9-]+$/, "Gunakan huruf, angka, dan tanda hubung saja (contoh: IN-01)."),
  location: z.enum(TABLE_LOCATIONS, { message: "Lokasi harus Indoor atau Outdoor." }),
});

export const tablePatchSchema = z.object({
  isActive: z.boolean().optional(),
  location: z.enum(TABLE_LOCATIONS).optional(),
});

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Data tidak valid.";
}
