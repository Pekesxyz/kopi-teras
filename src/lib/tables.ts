import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Validasi `tableId` dari URL QR. Mengembalikan null bila ID tidak valid atau
 * meja dinonaktifkan, sehingga halaman bisa menampilkan error yang ramah.
 */
export async function getActiveTable(tableId: string) {
  if (!tableId || tableId.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(tableId)) {
    return { table: null, reason: "invalid" as const };
  }
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    select: { id: true, tableNumber: true, location: true, isActive: true },
  });
  if (!table) return { table: null, reason: "invalid" as const };
  if (!table.isActive) return { table: null, reason: "inactive" as const };
  return { table, reason: null };
}

export const INACTIVE_TABLE_MESSAGE = {
  title: "Meja sedang tidak aktif",
  message:
    "Pemesanan dari meja ini sementara dinonaktifkan. Silakan pindah ke meja lain atau pesan langsung di kasir.",
};
