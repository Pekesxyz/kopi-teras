import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-[#CFE8F3] bg-white">
        <Image
          src="/logo-kopi-teras.jpg"
          alt="Kopi Teras"
          fill
          sizes="36px"
          className="object-cover"
        />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px] font-bold tracking-tight text-[#1B365D]">
            Kopi Teras.
          </span>
          <span className="text-muted-foreground mt-0.5 block text-[11px]">Pasar Modern</span>
        </span>
      )}
    </div>
  );
}
