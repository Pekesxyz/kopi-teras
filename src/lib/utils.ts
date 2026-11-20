import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(value: number) {
  return rupiahFormatter.format(value);
}

export const APP_TIMEZONE = "Asia/Jakarta";

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIMEZONE,
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIMEZONE,
  }).format(new Date(value));
}

/** Menghasilkan label durasi singkat, contoh: "baru saja", "3 mnt", "1 j 5 mnt". */
export function formatElapsed(from: string | Date, now: number = Date.now()) {
  const diffMs = Math.max(0, now - new Date(from).getTime());
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  return `${hours} j ${minutes % 60} mnt`;
}

/** Harga efektif menu: harga promo jika ada & lebih murah dari harga normal. */
export function getEffectivePrice(menu: { price: number; promoPrice: number | null }) {
  if (menu.promoPrice != null && menu.promoPrice > 0 && menu.promoPrice < menu.price) {
    return menu.promoPrice;
  }
  return menu.price;
}

/** Tanggal (zona Asia/Jakarta) dalam format YYYYMMDD — dipakai untuk nomor pesanan. */
export function getJakartaDateStamp(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}`;
}
