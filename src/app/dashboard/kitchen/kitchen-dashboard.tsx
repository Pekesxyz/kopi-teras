"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  CheckCircle2,
  ChefHat,
  Clock,
  Loader2,
  MapPin,
  PackageCheck,
  RefreshCw,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useOrderAlert } from "@/hooks/use-order-alert";
import { useNow } from "@/hooks/use-now";
import type { OrderStatusValue } from "@/lib/constants";
import { fetcher, FetchError, sendJson } from "@/lib/fetcher";
import type { OrderDTO } from "@/lib/types";
import { cn, formatElapsed, formatTime } from "@/lib/utils";

const POLL_INTERVAL = 3000;

export function KitchenDashboard({ initialOrders }: { initialOrders: OrderDTO[] }) {
  const now = useNow(15_000);
  const alert = useOrderAlert();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isValidating, mutate } = useSWR<{ orders: OrderDTO[] }>(
    "/api/orders?status=PROCESSING,READY",
    fetcher,
    {
      fallbackData: { orders: initialOrders },
      refreshInterval: POLL_INTERVAL,
      refreshWhenHidden: true,
      revalidateOnFocus: true,
    },
  );

  const orders = useMemo(() => data?.orders ?? initialOrders, [data, initialOrders]);

  // Urutan FIFO (First In, First Out) berdasarkan waktu pesanan masuk.
  const processingOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === "PROCESSING")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders],
  );

  const readyOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === "READY")
        .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()),
    [orders],
  );

  // Bunyikan bel ketika ada tiket PROCESSING baru yang masuk dari Kasir.
  useEffect(() => {
    const newCount = alert.notifyIfNew(processingOrders.map((o) => o.id));
    if (newCount > 0) {
      toast.info(`${newCount} pesanan baru masuk ke antrean dapur!`);
    }
  }, [processingOrders, alert]);

  const updateStatus = async (order: OrderDTO, nextStatus: OrderStatusValue) => {
    setBusyId(order.id);
    try {
      await sendJson(`/api/orders/${order.id}`, "PATCH", { status: nextStatus });
      await mutate();
      if (nextStatus === "READY") {
        toast.success(
          `Pesanan ${order.orderNumber} (Meja ${order.table.tableNumber}) ditandai SIAP DIAMBIL!`,
        );
      } else if (nextStatus === "COMPLETED") {
        toast.success(`Pesanan ${order.orderNumber} selesai diambil.`);
      }
    } catch (error) {
      toast.error(error instanceof FetchError ? error.message : "Gagal memperbarui status.");
      mutate();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header KDS */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kitchen Display System (KDS)</h1>
          <p className="text-muted-foreground text-sm">
            Antrean pesanan urut waktu masuk (FIFO). Tekan <strong>Pesanan Selesai</strong> untuk
            memanggil pelanggan ke konter.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {alert.enabled ? (
            <>
              <Button variant="secondary" size="sm" onClick={alert.play}>
                <Volume2 className="size-4" /> Tes Bel
              </Button>
              <Button variant="outline" size="sm" onClick={alert.disable}>
                <Bell className="size-4 text-emerald-600" /> Suara Aktif
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" onClick={alert.enable}>
              <BellOff className="size-4" /> Aktifkan Suara Bel
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className={cn("size-4", isValidating && "animate-spin")} />
            Segarkan
          </Button>
        </div>
      </div>

      {/* Bagian 1: Antrean Sedang Dibuat (FIFO) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ChefHat className="text-primary size-5" />
          <h2 className="text-lg font-bold">Antrean Diracik / Dimasak (FIFO)</h2>
          <Badge variant="default">{processingOrders.length}</Badge>
        </div>

        {processingOrders.length === 0 ? (
          <div className="bg-card flex flex-col items-center justify-center rounded-2xl border py-20 text-center">
            <ChefHat className="text-muted-foreground size-10" />
            <p className="mt-3 text-lg font-semibold">Semua pesanan sudah selesai diracik!</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Tiket baru akan muncul otomatis saat kasir mengonfirmasi pembayaran pelanggan.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {processingOrders.map((order, index) => {
              const elapsedMinutes = Math.floor(
                (now - new Date(order.createdAt).getTime()) / 60000,
              );
              const isLate = elapsedMinutes >= 10;

              return (
                <Card
                  key={order.id}
                  className={cn(
                    "border-2 shadow-sm",
                    isLate ? "border-amber-400 bg-amber-50/30" : "border-sky-300",
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg text-sm font-bold">
                          #{index + 1}
                        </span>
                        <div>
                          <span className="inline-flex items-center gap-1 text-lg font-extrabold">
                            <MapPin className="size-4" /> Meja {order.table.tableNumber}
                          </span>
                          <span className="text-muted-foreground ml-1.5 text-xs">
                            ({order.table.location})
                          </span>
                          <p className="text-muted-foreground font-mono text-xs">
                            {order.orderNumber} · {order.customerName}
                          </p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                          isLate ? "bg-amber-200 text-amber-950" : "bg-sky-100 text-sky-900",
                        )}
                      >
                        <Clock className="size-3.5" />
                        {formatElapsed(order.createdAt, now)} ({formatTime(order.createdAt)})
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="divide-y rounded-xl border bg-white px-3.5 py-1">
                      {order.items.map((item) => (
                        <li key={item.id} className="py-2.5">
                          <div className="flex items-baseline gap-2.5">
                            <span className="bg-secondary text-secondary-foreground inline-grid size-7 shrink-0 place-items-center rounded-md text-sm font-extrabold">
                              {item.quantity}×
                            </span>
                            <span className="text-base leading-snug font-bold">{item.name}</span>
                          </div>
                          {item.notes && (
                            <p className="mt-1 ml-9 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950">
                              Catatan: {item.notes}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="mt-auto pt-2">
                    <Button
                      size="lg"
                      variant="success"
                      className="w-full text-base font-bold"
                      disabled={busyId === order.id}
                      onClick={() => updateStatus(order, "READY")}
                    >
                      {busyId === order.id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-5" />
                      )}
                      Pesanan Selesai
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Bagian 2: Menunggu Diambil di Konter (READY) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <PackageCheck className="size-5 text-emerald-600" />
          <h2 className="text-lg font-bold">Siap Diambil di Konter (Self-Pickup)</h2>
          <Badge variant="secondary">{readyOrders.length}</Badge>
        </div>

        {readyOrders.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada pesanan yang menunggu diambil di konter.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {readyOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50/70 p-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950">
                      Meja {order.table.tableNumber}
                    </span>
                    <span className="font-mono text-xs text-emerald-800">{order.orderNumber}</span>
                  </div>
                  <p className="text-sm font-semibold">{order.customerName}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white"
                  disabled={busyId === order.id}
                  onClick={() => updateStatus(order, "COMPLETED")}
                >
                  {busyId === order.id ? <Loader2 className="animate-spin" /> : <PackageCheck />}
                  Sudah Diambil
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
