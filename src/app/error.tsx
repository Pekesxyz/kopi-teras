"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-8">
      <p className="font-mono text-xs font-semibold tracking-wider text-red-600 uppercase">
        Gangguan Koneksi
      </p>
      <h1 className="mt-2 text-2xl font-bold text-[#1B365D]">Gagal memuat halaman</h1>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        Pesanan di keranjang Anda tetap tersimpan di perangkat ini. Silakan muat ulang halaman.
      </p>
      <div className="mt-6">
        <Button onClick={reset}>Muat Ulang</Button>
      </div>
    </main>
  );
}
