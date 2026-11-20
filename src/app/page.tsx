import os from "node:os";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { QrLanding } from "@/components/customer/qr-landing";

export const dynamic = "force-dynamic";

function getLocalLanUrl(port = 3000): string {
  try {
    const nets = os.networkInterfaces();
    for (const entries of Object.values(nets)) {
      for (const net of entries ?? []) {
        if (net.family === "IPv4" && !net.internal && net.address.startsWith("192.168.")) {
          return `http://${net.address}:${port}`;
        }
      }
    }
    for (const entries of Object.values(nets)) {
      for (const net of entries ?? []) {
        if (net.family === "IPv4" && !net.internal) {
          return `http://${net.address}:${port}`;
        }
      }
    }
  } catch {
    /* abaikan */
  }
  return process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`;
}

export default async function HomePage() {
  const tables = await prisma.table
    .findMany({
      where: { isActive: true },
      select: { id: true, tableNumber: true, location: true },
      orderBy: [{ location: "asc" }, { tableNumber: "asc" }],
    })
    .catch(() => []);

  const suggestedBaseUrl = getLocalLanUrl(3000);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-[#CFE8F3] bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Logo />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-[#1B365D]/30 bg-white font-semibold text-[#1B365D] hover:border-[#005A9C] hover:bg-[#E3F5FB]"
          >
            <Link href="/login">
              <LogIn className="size-3.5" /> Login Staf
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <QrLanding tables={tables} suggestedBaseUrl={suggestedBaseUrl} />
      </main>

      <footer className="border-t border-[#CFE8F3] bg-white py-4 text-center text-xs text-[#466585]">
        Kopi Teras · Pasar Modern · Buka 24 Jam
      </footer>
    </div>
  );
}
