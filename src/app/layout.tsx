import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kopi Teras — Self Order",
    template: "%s · Kopi Teras",
  },
  description:
    "Pesan langsung dari meja: scan QR, pilih menu, bayar QRIS, dan ambil pesanan di konter Kopi Teras.",
  applicationName: "Kopi Teras",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1B365D",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
