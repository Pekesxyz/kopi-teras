import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-8">
      <Logo />
      <div className="my-auto py-12">
        <p className="font-mono text-xs font-semibold tracking-wider text-[#005A9C] uppercase">
          404 · Tidak Ditemukan
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[#1B365D]">Halaman tidak tersedia</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Tautan yang Anda buka mungkin sudah berubah atau tidak valid. Silakan pindai ulang kode
          QR pada meja Anda.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Ke Halaman Utama</Link>
        </Button>
      </div>
    </main>
  );
}
