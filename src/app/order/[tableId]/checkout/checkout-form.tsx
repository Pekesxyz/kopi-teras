"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import {
  AlertTriangle,
  Camera,
  Download,
  ImageUp,
  Loader2,
  Minus,
  Plus,
  Send,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MenuImage } from "@/components/menu-image";
import { CustomerHeader, type TableInfo } from "@/components/customer/customer-header";
import { useHydrated } from "@/hooks/use-hydrated";
import { fetcher, FetchError, sendJson, uploadImage } from "@/lib/fetcher";
import { compressImage } from "@/lib/image";
import type { MenuDTO, PublicOrderDTO } from "@/lib/types";
import { cn, formatRupiah, getEffectivePrice } from "@/lib/utils";
import { selectCartTotal, useCartStore } from "@/store/cart-store";

const CUSTOMER_KEY = "kopi-teras-customer";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CheckoutForm({ table, qrisImage }: { table: TableInfo; qrisImage: string }) {
  const router = useRouter();
  const hydrated = useHydrated();

  const items = useCartStore((s) => s.items);
  const total = useCartStore(selectCartTotal);
  const bindTable = useCartStore((s) => s.bindTable);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const removeMenus = useCartStore((s) => s.removeMenus);
  const syncPrices = useCartStore((s) => s.syncPrices);
  const clearCart = useCartStore((s) => s.clear);
  const setLastOrder = useCartStore((s) => s.setLastOrder);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"idle" | "upload" | "order">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    bindTable(table.id);
  }, [bindTable, table.id]);

  // Isi otomatis nama/email dari kunjungan sebelumnya.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? "{}");
      if (saved.name) setName(saved.name);
      if (saved.email) setEmail(saved.email);
    } catch {
      /* abaikan */
    }
  }, []);

  // Preview bukti bayar.
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Cek ketersediaan menu terbaru (menu bisa diubah menjadi Habis oleh admin kapan saja).
  const { data: menuData, mutate: refreshMenus } = useSWR<{ menus: MenuDTO[] }>(
    "/api/menus",
    fetcher,
    { refreshInterval: 10_000 },
  );
  const menuMap = useMemo(
    () => new Map((menuData?.menus ?? []).map((m) => [m.id, m])),
    [menuData],
  );
  useEffect(() => {
    if (!menuData) return;
    syncPrices(Object.fromEntries(menuData.menus.map((m) => [m.id, getEffectivePrice(m)])));
  }, [menuData, syncPrices]);

  const unavailableMenuIds = useMemo(() => {
    if (!menuData) return [];
    return [
      ...new Set(
        items.filter((i) => !menuMap.get(i.menuId)?.isAvailable).map((i) => i.menuId),
      ),
    ];
  }, [items, menuData, menuMap]);

  const emailInvalid = email.trim() !== "" && !EMAIL_RE.test(email.trim());
  const canSubmit =
    hydrated &&
    items.length > 0 &&
    name.trim().length > 0 &&
    !!file &&
    !emailInvalid &&
    unavailableMenuIds.length === 0 &&
    !submitting;

  const handleFileChange = (selected: File | undefined) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (foto/screenshot bukti bayar).");
      return;
    }
    if (selected.size > 15 * 1024 * 1024) {
      toast.error("Ukuran gambar terlalu besar (maks 15 MB).");
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !file) return;

    setSubmitting(true);
    try {
      setStep("upload");
      const compressed = await compressImage(file);
      const { url } = await uploadImage(compressed, "payment");

      setStep("order");
      const { order } = await sendJson<{ order: PublicOrderDTO }>("/api/orders", "POST", {
        tableId: table.id,
        customerName: name.trim(),
        customerEmail: email.trim() || null,
        paymentProofUrl: url,
        items: items.map((i) => ({
          menuId: i.menuId,
          quantity: i.quantity,
          notes: i.notes || null,
        })),
      });

      localStorage.setItem(
        CUSTOMER_KEY,
        JSON.stringify({ name: name.trim(), email: email.trim() }),
      );
      submittedRef.current = true;
      setLastOrder(table.id, { orderId: order.id, orderNumber: order.orderNumber });
      router.replace(`/order/${table.id}/status/${order.id}`);
      clearCart();
      toast.success("Pesanan terkirim! Menunggu verifikasi kasir.");
    } catch (error) {
      const message =
        error instanceof FetchError
          ? error.message
          : "Koneksi terputus. Keranjangmu aman, silakan coba kirim lagi.";
      toast.error(message);
      if (error instanceof FetchError && error.status === 409) refreshMenus();
      setSubmitting(false);
      setStep("idle");
    }
  };

  if (!hydrated) {
    return (
      <div className="min-h-dvh">
        <CustomerHeader table={table} backHref={`/order/${table.id}`} title="Checkout" />
        <div className="grid place-items-center py-24">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (items.length === 0 && !submittedRef.current) {
    return (
      <div className="min-h-dvh">
        <CustomerHeader table={table} backHref={`/order/${table.id}`} title="Checkout" />
        <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
          <span className="bg-secondary grid size-16 place-items-center rounded-2xl">
            <ShoppingBag className="text-primary size-8" />
          </span>
          <h2 className="mt-4 text-xl font-bold">Keranjang masih kosong</h2>
          <p className="text-muted-foreground mt-1">Yuk pilih menu favoritmu dulu.</p>
          <Button asChild className="mt-6">
            <Link href={`/order/${table.id}`}>Lihat Menu</Link>
          </Button>
        </div>
      </div>
    );
  }

  const submitLabel =
    step === "upload"
      ? "Mengunggah bukti bayar…"
      : step === "order"
        ? "Mengirim pesanan…"
        : "Kirim Pesanan";

  return (
    <div className="min-h-dvh pb-36">
      <CustomerHeader table={table} backHref={`/order/${table.id}`} title="Checkout" />

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        {/* 1. Ringkasan keranjang */}
        <Card className="gap-3">
          <CardHeader>
            <CardTitle>Pesanan Kamu</CardTitle>
            <CardDescription>
              Meja {table.tableNumber} · {table.location} · Ambil sendiri di konter
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {items.map((item) => {
              const unavailable = unavailableMenuIds.includes(item.menuId);
              return (
                <div key={item.key} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <MenuImage
                    src={item.imageUrl}
                    alt={item.name}
                    category={menuMap.get(item.menuId)?.category ?? "Coffee"}
                    className={cn("size-16 shrink-0 rounded-lg", unavailable && "grayscale")}
                    sizes="64px"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="leading-snug font-medium">{item.name}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        aria-label={`Hapus ${item.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    {item.notes && (
                      <p className="text-muted-foreground text-xs italic">“{item.notes}”</p>
                    )}
                    {unavailable && (
                      <p className="mt-1 text-xs font-semibold text-red-600">
                        Menu ini sedang habis — hapus untuk melanjutkan.
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full border">
                        <button
                          type="button"
                          className="grid size-8 place-items-center"
                          onClick={() => setQuantity(item.key, item.quantity - 1)}
                          aria-label="Kurangi"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="grid size-8 place-items-center"
                          onClick={() => setQuantity(item.key, item.quantity + 1)}
                          aria-label="Tambah"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="font-semibold">
                        {formatRupiah(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
          {unavailableMenuIds.length > 0 && (
            <CardContent>
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div className="flex-1">
                  Beberapa menu baru saja habis.
                  <button
                    type="button"
                    className="ml-1 font-semibold underline"
                    onClick={() => removeMenus(unavailableMenuIds)}
                  >
                    Hapus semua yang habis
                  </button>
                </div>
              </div>
            </CardContent>
          )}
          <CardContent>
            <div className="bg-secondary/60 flex items-center justify-between rounded-lg px-3 py-2.5">
              <span className="font-medium">Total Tagihan</span>
              <span className="text-xl font-bold">{formatRupiah(total)}</span>
            </div>
            <Link
              href={`/order/${table.id}`}
              className="text-primary mt-3 inline-block text-sm font-medium underline-offset-4 hover:underline"
            >
              + Tambah menu lain
            </Link>
          </CardContent>
        </Card>

        {/* 2. Data pemesan */}
        <Card className="gap-3">
          <CardHeader>
            <CardTitle>Data Pemesan</CardTitle>
            <CardDescription>Nama akan dipanggil saat pesanan siap diambil.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">
                Nama <span className="text-red-600">*</span>
              </Label>
              <Input
                id="customer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi"
                maxLength={60}
                autoComplete="given-name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">
                Email <span className="text-muted-foreground font-normal">(opsional)</span>
              </Label>
              <Input
                id="customer-email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                maxLength={120}
                autoComplete="email"
                aria-invalid={emailInvalid || undefined}
              />
              {emailInvalid && <p className="text-xs text-red-600">Format email tidak valid.</p>}
            </div>
          </CardContent>
        </Card>

        {/* 3. Pembayaran QRIS */}
        <Card className="gap-3">
          <CardHeader>
            <CardTitle>Bayar via QRIS</CardTitle>
            <CardDescription>
              Scan QRIS di bawah memakai e-wallet / m-banking, lalu bayar tepat{" "}
              <strong className="text-foreground">{formatRupiah(total)}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-full max-w-[280px] overflow-hidden rounded-2xl border bg-white p-2 shadow-sm">
              <Image
                src={qrisImage}
                alt="QRIS Kopi Teras"
                width={400}
                height={520}
                className="h-auto w-full"
                unoptimized
                priority
              />
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <a href={qrisImage} download="QRIS-Kopi-Teras">
                <Download /> Simpan Gambar QRIS
              </a>
            </Button>
            <p className="text-muted-foreground mt-2 text-center text-xs">
              Bayar dari HP yang sama? Simpan gambar QRIS lalu pilih “Upload dari galeri” di
              aplikasi e-wallet.
            </p>
          </CardContent>
        </Card>

        {/* 4. Upload bukti bayar */}
        <Card className="gap-3">
          <CardHeader>
            <CardTitle>
              Unggah Bukti Bayar <span className="text-red-600">*</span>
            </CardTitle>
            <CardDescription>Screenshot / foto layar transaksi berhasil.</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleFileChange(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {preview ? (
              <div className="relative mx-auto w-full max-w-[280px]">
                {/* eslint-disable-next-line @next/next/no-img-element -- preview blob lokal */}
                <img
                  src={preview}
                  alt="Preview bukti bayar"
                  className="max-h-96 w-full rounded-xl border object-contain"
                />
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/60 text-white"
                  aria-label="Hapus gambar"
                  disabled={submitting}
                >
                  <X className="size-4" />
                </button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                >
                  <ImageUp /> Ganti Gambar
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="hover:bg-muted/60 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors"
              >
                <span className="bg-secondary grid size-12 place-items-center rounded-full">
                  <Camera className="text-primary size-6" />
                </span>
                <span className="font-semibold">Pilih / Foto Bukti Bayar</span>
                <span className="text-muted-foreground text-xs">JPG, PNG, WEBP, HEIC</span>
              </button>
            )}
          </CardContent>
        </Card>

        {/* Tombol kirim (sticky) */}
        <div className="pb-safe bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 backdrop-blur">
          <div className="mx-auto max-w-2xl">
            {!canSubmit && !submitting && (
              <p className="text-muted-foreground mb-2 text-center text-xs">
                {!name.trim()
                  ? "Isi nama terlebih dahulu."
                  : !file
                    ? "Unggah bukti pembayaran untuk mengirim pesanan."
                    : unavailableMenuIds.length > 0
                      ? "Hapus menu yang habis dari keranjang."
                      : emailInvalid
                        ? "Perbaiki format email."
                        : ""}
              </p>
            )}
            <Button type="submit" size="xl" className="w-full" disabled={!canSubmit}>
              {submitting ? <Loader2 className="animate-spin" /> : <Send />}
              {submitLabel}
              {!submitting && <span className="opacity-80">· {formatRupiah(total)}</span>}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
