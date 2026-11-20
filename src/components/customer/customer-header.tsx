import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn, formatRupiah, getEffectivePrice } from "@/lib/utils";

export type TableInfo = { id: string; tableNumber: string; location: string };

export function CustomerHeader({
  table,
  backHref,
  title,
}: {
  table: TableInfo;
  backHref?: string;
  title?: string;
}) {
  return (
    <header className=" sticky top-0 z-30 border-b border-[#CFE8F3] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
        {backHref ? (
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={backHref}
              className="hover:bg-muted -ml-2 grid size-9 place-items-center rounded-lg text-[#1B365D]"
              aria-label="Kembali"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <h1 className="truncate text-base font-semibold text-[#1B365D]">{title}</h1>
          </div>
        ) : (
          <Logo />
        )}
        <div className="flex shrink-0 items-center gap-2 rounded-md border border-[#CFE8F3] bg-[#F4FAFD] px-2.5 py-1 text-xs">
          <span className="font-mono font-bold text-[#1B365D]">MEJA {table.tableNumber}</span>
          <span className="text-muted-foreground border-l border-[#CFE8F3] pl-2 uppercase">
            {table.location}
          </span>
        </div>
      </div>
    </header>
  );
}

export function PriceTag({
  price,
  promoPrice,
  className,
}: {
  price: number;
  promoPrice?: number | null;
  className?: string;
}) {
  const effective = getEffectivePrice({ price, promoPrice: promoPrice ?? null });
  return (
    <div className={cn("flex items-baseline", className)}>
      <span className="font-bold text-[#1B365D]">{formatRupiah(effective)}</span>
    </div>
  );
}
