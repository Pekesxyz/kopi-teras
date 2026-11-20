import Link from "next/link";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

/** Halaman error ramah untuk QR meja yang tidak valid / meja nonaktif (bukan crash). */
export function InvalidTable({
  title = "QR Code meja tidak dikenali",
  message = "Link meja ini tidak valid atau sudah tidak berlaku. Silakan pindai ulang stiker QR Code di meja Anda, atau minta bantuan staf kasir.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <Logo />
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="grid size-20 place-items-center rounded-3xl bg-[#A0E0EF]/40">
          <QrCode className="size-10 text-[#005A9C]" />
        </span>
        <h1 className="mt-6 text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-3 leading-relaxed">{message}</p>
        <Button asChild variant="outline" className="mt-8">
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    </main>
  );
}
