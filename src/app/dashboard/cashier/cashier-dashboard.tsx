"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Loader2,
  MapPin,
  PackageCheck,
  Printer,
  RefreshCw,
  Volume2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ThermalReceipt, type ReceiptWidth } from "@/components/dashboard/thermal-receipt";
import { useOrderAlert } from "@/hooks/use-order-alert";
import { useNow } from "@/hooks/use-now";
import type { OrderStatusValue } from "@/lib/constants";
import { fetcher, FetchError, sendJson } from "@/lib/fetcher";
import type { OrderDTO } from "@/lib/types";
import { cn, formatDateTime, formatElapsed, formatRupiah, formatTime } from "@/lib/utils";

const POLL_INTERVAL = 3000;
const RECEIPT_WIDTH_KEY = "kopi-teras-receipt-width";

export function CashierDashboard({ initialOrders }: { initialOrders: OrderDTO[] }) {
  const now = useNow();
  const alert = useOrderAlert();

  const { data, isValidating, mutate } = useSWR<{ orders: OrderDTO[] }>(
    "/api/orders?limit=150",
    fetcher,
    {
      fallbackData: { orders: initialOrders },
      refreshInterval: POLL_INTERVAL,
      refreshWhenHidden: true,
      revalidateOnFocus: true,
    },
  );

  const orders = useMemo(() => data?.orders ?? initialOrders, [data, initialOrders]);

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === "PENDING_VERIFICATION"),
    [orders],
  );
  const readyOrders = useMemo(() => orders.filter((o) => o.status === "READY"), [orders]);
  const processingOrders = useMemo(
    () => orders.filter((o) => o.status === "PROCESSING"),
    [orders],
  );
  const historyOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === "COMPLETED" || o.status === "CANCELLED")
        .slice()
        .reverse(),
    [orders],
  );

  // Bunyikan bel ketika ada pesanan baru berstatus PENDING_VERIFICATION.
  useEffect(() => {
    const newCount = alert.notifyIfNew(pendingOrders.map((o) => o.id));
    if (newCount > 0) {
      toast.info(`${newCount} pesanan baru menunggu verifikasi pembayaran!`);
    }
  }, [pendingOrders, alert]);

  const [receiptWidth, setReceiptWidth] = useState<ReceiptWidth>("80");
  useEffect(() => {
    const saved = localStorage.getItem(RECEIPT_WIDTH_KEY);
    if (saved === "58" || saved === "80") setReceiptWidth(saved);
  }, []);
  const handleReceiptWidth = (w: ReceiptWidth) => {
    setReceiptWidth(w);
    localStorage.setItem(RECEIPT_WIDTH_KEY, w);
  };

  const [printingOrder, setPrintingOrder] = useState<OrderDTO | null>(null);
  const [previewOrder, setPreviewOrder] = useState<OrderDTO | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const triggerPrint = (order: OrderDTO) => {
    setPrintingOrder(order);
    // Beri waktu 1 frame agar PrintPortal selesai merender struk sebelum window.print().
    setTimeout(() => {
      window.print();
    }, 80);
  };

  const updateStatus = async (
    order: OrderDTO,
    nextStatus: OrderStatusValue,
    options?: { autoPrint?: boolean },
  ) => {
    setBusyId(order.id);
    try {
      const res = await sendJson<{ order: OrderDTO }>(`/api/orders/${order.id}`, "PATCH", {
        status: nextStatus,
      });
      await mutate();
      setPreviewOrder(null);

      if (nextStatus === "PROCESSING") {
        toast.success(
          `Pesanan ${order.orderNumber} dikonfirmasi lunas & diteruskan ke layar Dapur.`,
        );
        if (options?.autoPrint) {
          triggerPrint(res.order);
        }
      } else if (nextStatus === "CANCELLED") {
        toast.warning(`Pesanan ${order.orderNumber} dibatalkan.`);
      } else if (nextStatus === "COMPLETED") {
        toast.success(`Pesanan ${order.orderNumber} selesai diambil pelanggan.`);
      }
    } catch (error) {
      toast.error(error instanceof FetchError ? error.message : "Gagal memperbarui status.");
      mutate();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & kontrol suara + printer */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Kasir</h1>
          <p className="text-muted-foreground text-sm">
            Verifikasi bukti bayar QRIS, cetak struk thermal otomatis, dan pantau pengambilan
            pesanan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Pilihan lebar kertas struk */}
          <div className="bg-muted inline-flex items-center rounded-lg p-1 text-xs font-medium">
            <span className="text-muted-foreground px-2">Struk:</span>
            {(["58", "80"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => handleReceiptWidth(w)}
                className={cn(
                  "rounded-md px-2.5 py-1 transition-colors",
                  receiptWidth === w ? "bg-background text-foreground shadow-xs" : "opacity-70",
                )}
              >
                {w}mm
              </button>
            ))}
          </div>

          {alert.enabled ? (
            <>
              <Button variant="secondary" size="sm" onClick={alert.play} title="Tes bunyi bel">
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

      {!alert.enabled && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>
            Notifikasi suara belum aktif. Klik <strong>Aktifkan Suara Bel</strong> agar browser
            mengizinkan bunyi bel otomatis saat pesanan baru masuk.
          </span>
          <Button size="sm" onClick={alert.enable}>
            Aktifkan Sekarang
          </Button>
        </div>
      )}

      {/* Ringkasan cepat */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Menunggu Verifikasi"
          value={pendingOrders.length}
          tone={pendingOrders.length > 0 ? "amber" : "default"}
        />
        <StatCard label="Sedang Dibuat Dapur" value={processingOrders.length} tone="sky" />
        <StatCard
          label="Siap Diambil"
          value={readyOrders.length}
          tone={readyOrders.length > 0 ? "emerald" : "default"}
        />
        <StatCard label="Riwayat Hari Ini" value={historyOrders.length} tone="default" />
      </div>

      {/* Tabs antrean */}
      <Tabs defaultValue="pending">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="pending">
            Verifikasi Bayar
            {pendingOrders.length > 0 && (
              <Badge className="ml-1 bg-amber-600 text-white">{pendingOrders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ready">
            Siap Diambil
            {readyOrders.length > 0 && (
              <Badge className="ml-1 bg-emerald-600 text-white">{readyOrders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processing">Diproses Dapur ({processingOrders.length})</TabsTrigger>
          <TabsTrigger value="history">Riwayat ({historyOrders.length})</TabsTrigger>
        </TabsList>

        {/* Tab 1: Menunggu Verifikasi */}
        <TabsContent value="pending">
          {pendingOrders.length === 0 ? (
            <EmptyState
              title="Belum ada pesanan yang menunggu verifikasi"
              description="Pesanan baru dari pelanggan akan muncul otomatis di sini disertai bunyi bel."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingOrders.map((order) => (
                <PendingOrderCard
                  key={order.id}
                  order={order}
                  now={now}
                  busy={busyId === order.id}
                  onPreviewProof={() => setPreviewOrder(order)}
                  onConfirm={() => updateStatus(order, "PROCESSING", { autoPrint: true })}
                  onCancel={() => updateStatus(order, "CANCELLED")}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Siap Diambil di Konter */}
        <TabsContent value="ready">
          {readyOrders.length === 0 ? (
            <EmptyState
              title="Tidak ada pesanan yang menunggu diambil"
              description="Pesanan yang ditandai selesai oleh Dapur akan tampil di sini."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {readyOrders.map((order) => (
                <ActiveOrderCard
                  key={order.id}
                  order={order}
                  now={now}
                  busy={busyId === order.id}
                  onPrint={() => triggerPrint(order)}
                  onPreviewProof={() => setPreviewOrder(order)}
                  primaryAction={{
                    label: "Tandai Sudah Diambil",
                    onClick: () => updateStatus(order, "COMPLETED"),
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Sedang Diproses Dapur */}
        <TabsContent value="processing">
          {processingOrders.length === 0 ? (
            <EmptyState
              title="Tidak ada pesanan yang sedang diracik dapur"
              description="Setelah Anda menekan Konfirmasi Lunas, pesanan berpindah ke layar Dapur."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {processingOrders.map((order) => (
                <ActiveOrderCard
                  key={order.id}
                  order={order}
                  now={now}
                  busy={busyId === order.id}
                  onPrint={() => triggerPrint(order)}
                  onPreviewProof={() => setPreviewOrder(order)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 4: Riwayat */}
        <TabsContent value="history">
          {historyOrders.length === 0 ? (
            <EmptyState
              title="Belum ada riwayat pesanan"
              description="Pesanan yang sudah selesai atau dibatalkan akan tercatat di sini."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {historyOrders.map((order) => (
                <ActiveOrderCard
                  key={order.id}
                  order={order}
                  now={now}
                  busy={busyId === order.id}
                  onPrint={() => triggerPrint(order)}
                  onPreviewProof={() => setPreviewOrder(order)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog perbesar bukti bayar */}
      <Dialog open={!!previewOrder} onOpenChange={(open) => !open && setPreviewOrder(null)}>
        <DialogContent className="sm:max-w-xl">
          {previewOrder && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Bukti Pembayaran · {previewOrder.orderNumber} (Meja{" "}
                  {previewOrder.table.tableNumber})
                </DialogTitle>
                <DialogDescription>
                  Atas nama <strong>{previewOrder.customerName}</strong> · Tagihan{" "}
                  <strong className="text-foreground">
                    {formatRupiah(previewOrder.totalAmount)}
                  </strong>
                </DialogDescription>
              </DialogHeader>

              <div className="bg-muted/50 flex max-h-[65dvh] items-center justify-center overflow-auto rounded-xl border p-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- file dinamis dari /api/files */}
                <img
                  src={previewOrder.paymentProofUrl}
                  alt={`Bukti bayar ${previewOrder.orderNumber}`}
                  className="max-h-[60dvh] w-auto rounded-lg object-contain"
                />
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button asChild variant="outline" size="sm">
                  <a href={previewOrder.paymentProofUrl} target="_blank" rel="noreferrer">
                    <ExternalLink /> Buka Gambar Asli
                  </a>
                </Button>

                {previewOrder.status === "PENDING_VERIFICATION" && (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      disabled={busyId === previewOrder.id}
                      onClick={() => updateStatus(previewOrder, "CANCELLED")}
                    >
                      <XCircle /> Batalkan
                    </Button>
                    <Button
                      variant="success"
                      disabled={busyId === previewOrder.id}
                      onClick={() =>
                        updateStatus(previewOrder, "PROCESSING", { autoPrint: true })
                      }
                    >
                      {busyId === previewOrder.id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <CheckCircle2 />
                      )}
                      Konfirmasi Lunas & Cetak
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Portal struk thermal (@media print) */}
      <ThermalReceipt order={printingOrder} width={receiptWidth} />
    </div>
  );
}

function PendingOrderCard({
  order,
  now,
  busy,
  onPreviewProof,
  onConfirm,
  onCancel,
}: {
  order: OrderDTO;
  now: number;
  busy: boolean;
  onPreviewProof: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Card className="border-amber-300/80 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold">
              <MapPin className="size-3.5" /> Meja {order.table.tableNumber} ·{" "}
              {order.table.location}
            </span>
            <CardTitle className="mt-2 font-mono text-base">{order.orderNumber}</CardTitle>
          </div>
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <Clock className="size-3.5" /> {formatElapsed(order.createdAt, now)}
          </span>
        </div>
        <p className="text-sm">
          Pemesan: <strong>{order.customerName}</strong>
          {order.customerEmail && (
            <span className="text-muted-foreground"> · {order.customerEmail}</span>
          )}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Thumbnail bukti bayar */}
        <button
          type="button"
          onClick={onPreviewProof}
          className="group relative block h-44 w-full overflow-hidden rounded-xl border bg-[#EAF6FB]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.paymentProofUrl}
            alt={`Bukti bayar ${order.orderNumber}`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/65 py-1.5 text-xs font-medium text-white">
            <Eye className="size-3.5" /> Periksa Bukti Bayar
          </span>
        </button>

        {/* Daftar item */}
        <div className="divide-y rounded-lg border bg-[#F4FAFD] px-3 py-1 text-sm">
          {order.items.map((item) => (
            <div key={item.id} className="py-1.5">
              <div className="flex justify-between gap-2">
                <span>
                  <strong>{item.quantity}×</strong> {item.name}
                </span>
                <span className="text-muted-foreground shrink-0">
                  {formatRupiah(item.unitPrice * item.quantity)}
                </span>
              </div>
              {item.notes && (
                <p className="text-xs font-medium text-amber-800 italic">Catatan: {item.notes}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-muted-foreground text-sm">Total Tagihan</span>
          <span className="text-lg font-bold">{formatRupiah(order.totalAmount)}</span>
        </div>
      </CardContent>

      <CardFooter className="mt-auto gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="border-red-200 text-red-700 hover:bg-red-50"
          disabled={busy}
          onClick={onCancel}
        >
          <XCircle /> Batalkan
        </Button>
        <Button
          type="button"
          variant="success"
          className="flex-1"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
          Konfirmasi Lunas
        </Button>
      </CardFooter>
    </Card>
  );
}

function ActiveOrderCard({
  order,
  now,
  busy,
  onPrint,
  onPreviewProof,
  primaryAction,
}: {
  order: OrderDTO;
  now: number;
  busy: boolean;
  onPrint: () => void;
  onPreviewProof: () => void;
  primaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold">
              Meja {order.table.tableNumber} · {order.table.location}
            </span>
            <CardTitle className="mt-1.5 font-mono text-base">{order.orderNumber}</CardTitle>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-muted-foreground text-xs">
          {order.customerName} · {formatTime(order.createdAt)} WIB (
          {formatElapsed(order.createdAt, now)}) · {formatDateTime(order.createdAt)}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="divide-y rounded-lg border px-3 py-1 text-sm">
          {order.items.map((item) => (
            <div key={item.id} className="py-1.5">
              <div className="flex justify-between gap-2">
                <span>
                  <strong>{item.quantity}×</strong> {item.name}
                </span>
                <span className="text-muted-foreground">
                  {formatRupiah(item.unitPrice * item.quantity)}
                </span>
              </div>
              {item.notes && <p className="text-muted-foreground text-xs italic">“{item.notes}”</p>}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-bold">{formatRupiah(order.totalAmount)}</span>
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex-wrap gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onPreviewProof}>
          <Eye /> Bukti Bayar
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onPrint}>
          <Printer /> Cetak Struk
        </Button>
        {primaryAction && (
          <Button
            type="button"
            size="sm"
            className="ml-auto"
            disabled={busy}
            onClick={primaryAction.onClick}
          >
            {busy ? <Loader2 className="animate-spin" /> : <PackageCheck />}
            {primaryAction.label}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "amber" | "sky" | "emerald";
}) {
  const toneClass = {
    default: "bg-card",
    amber: "border-amber-300 bg-amber-50/80 text-amber-950",
    sky: "border-sky-200 bg-sky-50/70 text-sky-950",
    emerald: "border-emerald-300 bg-emerald-50/80 text-emerald-950",
  }[tone];

  return (
    <div className={cn("rounded-xl border p-4 shadow-xs", toneClass)}>
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-card flex flex-col items-center justify-center rounded-2xl border py-16 text-center">
      <p className="font-semibold">{title}</p>
      <p className="text-muted-foreground mt-1 max-w-md text-sm">{description}</p>
    </div>
  );
}
