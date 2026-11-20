import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

export const QRCODES_DIR = path.join(process.cwd(), "public", "qrcodes");

/**
 * Menyimpan file gambar QR Code meja ke dalam satu folder terpusat:
 * `public/qrcodes/QR-Meja-<tableNumber>.png`
 */
export async function saveTableQrFile(
  table: { id: string; tableNumber: string; location: string },
  baseUrl?: string,
) {
  await mkdir(QRCODES_DIR, { recursive: true });
  const base = (baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
  const targetUrl = `${base}/order/${table.id}`;
  const filePath = path.join(QRCODES_DIR, `QR-Meja-${table.tableNumber}.png`);

  await QRCode.toFile(filePath, targetUrl, {
    type: "png",
    width: 600,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#1B365D", light: "#FFFFFF" },
  });

  return `/qrcodes/QR-Meja-${table.tableNumber}.png`;
}

export async function removeTableQrFile(tableNumber: string) {
  const filePath = path.join(QRCODES_DIR, `QR-Meja-${tableNumber}.png`);
  await unlink(filePath).catch(() => {});
}
