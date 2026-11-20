"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import { Check, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerHeader } from "@/components/customer/customer-header";
import { ORDER_STATUS_META, type OrderStatusValue } from "@/lib/constants";
import { fetcher } from "@/lib/fetcher";
import type { PublicOrderDTO } from "@/lib/types";
import { cn, formatRupiah, formatTime } from "@/lib/utils";

const POLL_INTERVAL = 3000;
const TERMINAL: OrderStatusValue[] = ["COMPLETED", "CANCELLED"];

const STEPS: { status: OrderStatusValue; label: string }[] = [
  { status: "PENDING_VERIFICATION", label: "Verifikasi Kasir" },
  { status: "PROCESSING", label: "Sedang Diracik" },
  { status: "READY", label: "Siap Diambil" },
];

const STEP_INDEX: Record<OrderStatusValue, number> = {
  PENDING_VERIFICATION: 0,
  PROCESSING: 1,
  READY: 2,
  COMPLETED: 3,
  CANCELLED: -1,
};

export function OrderStatusTracker({ initialOrder }: { initialOrder: PublicOrderDTO }) {
  const { data, error, isValidating, mutate } = useSWR<{ order: PublicOrderDTO }>(
    `/api/orders/${initialOrder.id}`,
    fetcher,
    {
      fallbackData: { order: initialOrder },
      refreshInterval: (latest) =>
        latest && TERMINAL.includes(latest.order.status) ? 0 : POLL_INTERVAL,
      refreshWhenHidden: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );

  const order = data?.order ?? initialOrder;
  const meta = ORDER_STATUS_META[order.status];
  const prevStatus = useRef(order.status);

  useEffect(() => {
    if (prevStatus.current === order.status) return;
    prevStatus.current = order.status;

    if (order.status === "READY") {
      navigator.vibrate?.([300, 120, 300, 120, 500]);
      new Audio("/sounds/bell.wav").play().catch(() => {});
      toast.success("Pesanan Anda siap diambil di konter.", { duration: 10_000 });
    } else if (order.status === "PROCESSING") {
      navigator.vibrate?.(200);
      toast.success("Pembayaran terverifikasi. Pesanan sedang dibuat.");
    } else if (order.status === "CANCELLED") {
      navigator.vibrate?.([200, 100, 200]);
      toast.error("Pesanan dibatalkan. Silakan hubungi kasir.");
    }
  }, [order.status]);

  useEffect(() => {
    document.title =
      order.status === "READY"
        ? "Pesanan Siap Diambil · Kopi Teras"
        : `${meta.label} · Kopi Teras`;
  }, [order.status, meta.label]);

  const stepIndex = STEP_INDEX[order.status];
  const isReady = order.status === "READY";
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="min-h-dvh pb-10">
      <CustomerHeader table={order.table} />

      <main className="mx-auto max-w-lg space-y-4 px-4 pt-5">
        {/* Tiket Status Utama */}
        <section
          className={cn(
            "overflow-hidden rounded-xl border bg-white",
            isReady
              ? "border-emerald-500"
              : isCancelled
                ? "border-red-300"
                : "border-[#CFE8F3]",
          )}
          aria-live="polite"
        >
          <div
            className={cn(
              "px-5 py-4 text-white",
              isReady
                ? "bg-emerald-700"
                : isCancelled
                  ? "bg-red-700"
                  : "bg-[#1B365D]",
            )}
          >
            <div className="flex items-center justify-between text-xs opacity-80">
              <span>NOMOR PESANAN</span>
              <span>MEJA {order.table.tableNumber}</span>
            </div>
            <p className="mt-1 font-mono text-2xl font-bold tracking-tight">
              {order.orderNumber}
            </p>
          </div>

          <div className="p-5">
            <p className="text-lg font-bold text-[#1B365D]">{meta.customerLabel}</p>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              {meta.description}
            </p>

            {isReady && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-900">
                Silakan tunjukkan nomor pesanan ini kepada staf di konter pengambilan.
              </div>
            )}

            {/* Tahapan Progres */}
            {!isCancelled && (
              <ol className="mt-5 grid grid-cols-3 gap-2 border-t border-[#CFE8F3] pt-4">
                {STEPS.map((step, i) => {
                  const done = stepIndex > i;
                  const active = stepIndex === i;
                  return (
                    <li key={step.status} className="space-y-1.5">
                      <div
                        className={cn(
                          "h-1.5 w-full rounded-full",
                          done
                            ? "bg-emerald-600"
                            : active
                              ? "bg-[#005A9C]"
                              : "bg-[#E3F5FB]",
                        )}
                      />
                      <div className="flex items-center gap-1 text-[11px] font-semibold">
                        {done && <Check className="size-3 text-emerald-600" />}
                        <span
                          className={cn(
                            active
                              ? "text-[#1B365D]"
                              : done
                                ? "text-emerald-700"
                                : "text-muted-foreground",
                          )}
                        >
                          {step.label}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>

        {/* Rincian struk digital */}
        <section className="rounded-xl border border-[#CFE8F3] bg-white p-5">
          <h2 className="text-xs font-bold tracking-wider text-[#466585] uppercase">
            Rincian Pesanan
          </h2>

          <dl className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nama Pemesan</dt>
              <dd className="font-semibold text-[#1B365D]">{order.customerName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nomor Meja</dt>
              <dd className="font-semibold text-[#1B365D]">
                {order.table.tableNumber} ({order.table.location})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Waktu Pesan</dt>
              <dd className="font-mono font-semibold text-[#1B365D]">
                {formatTime(order.createdAt)} WIB
              </dd>
            </div>
          </dl>

          <div className="my-3 divide-y divide-dashed divide-[#CFE8F3] border-y border-dashed border-[#CFE8F3]">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-[#1B365D]">
                    <span className="font-mono font-bold">{item.quantity}x</span> {item.name}
                  </p>
                  {item.notes && (
                    <p className="text-muted-foreground mt-0.5 text-xs">Catatan: {item.notes}</p>
                  )}
                </div>
                <span className="shrink-0 font-mono text-xs font-semibold text-[#1B365D]">
                  {formatRupiah(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-[#1B365D]">Total Pembayaran</span>
            <span className="font-mono text-base font-bold text-[#1B365D]">
              {formatRupiah(order.totalAmount)}
            </span>
          </div>
        </section>

        {/* Indikator sinkronisasi */}
        <div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
          {error ? (
            <>
              <WifiOff className="size-3.5 text-amber-600" />
              <span>Koneksi terputus</span>
              <button type="button" className="underline" onClick={() => mutate()}>
                Muat ulang
              </button>
            </>
          ) : !TERMINAL.includes(order.status) ? (
            <>
              <RefreshCw className={cn("size-3", isValidating && "animate-spin")} />
              <span>Memantau pembaruan status otomatis</span>
            </>
          ) : null}
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href={`/order/${order.table.id}`}>Kembali ke Menu</Link>
        </Button>
      </main>
    </div>
  );
}
