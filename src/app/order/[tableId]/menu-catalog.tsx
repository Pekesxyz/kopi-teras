"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import { ChevronRight, Minus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MenuImage } from "@/components/menu-image";
import { CustomerHeader, PriceTag, type TableInfo } from "@/components/customer/customer-header";
import { useHydrated } from "@/hooks/use-hydrated";
import { fetcher } from "@/lib/fetcher";
import type { MenuDTO } from "@/lib/types";
import { cn, formatRupiah, getEffectivePrice } from "@/lib/utils";
import { selectCartCount, selectCartTotal, useCartStore } from "@/store/cart-store";

const CATEGORY_ORDER = ["Coffee", "Non-Coffee", "Main Course", "Snack", "Promo"] as const;
const CATEGORY_LABEL: Record<string, string> = {
  Coffee: "Coffee",
  "Non-Coffee": "Non-Coffee",
  "Main Course": "Makanan Berat",
  Snack: "Snack",
  Promo: "Paket Hemat",
};
const QUICK_NOTES = ["Less sugar", "Less ice", "Normal ice", "Extra shot", "Tidak pedas", "Pedas"];

export function MenuCatalog({
  table,
  initialMenus,
}: {
  table: TableInfo;
  initialMenus: MenuDTO[];
}) {
  const hydrated = useHydrated();
  const bindTable = useCartStore((s) => s.bindTable);
  const syncPrices = useCartStore((s) => s.syncPrices);
  const cartCount = useCartStore(selectCartCount);
  const cartTotal = useCartStore(selectCartTotal);
  const lastOrder = useCartStore((s) => s.lastOrders[table.id]);

  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MenuDTO | null>(null);

  useEffect(() => {
    bindTable(table.id);
  }, [bindTable, table.id]);

  const { data } = useSWR<{ menus: MenuDTO[] }>("/api/menus", fetcher, {
    fallbackData: { menus: initialMenus },
    refreshInterval: 10_000,
    revalidateOnMount: false,
  });
  const menus = useMemo(() => data?.menus ?? initialMenus, [data, initialMenus]);

  useEffect(() => {
    syncPrices(Object.fromEntries(menus.map((m) => [m.id, getEffectivePrice(m)])));
  }, [menus, syncPrices]);

  useEffect(() => {
    if (!selected) return;
    const fresh = menus.find((m) => m.id === selected.id);
    if (!fresh || !fresh.isAvailable) {
      setSelected(null);
      toast.warning(`${selected.name} sedang habis.`);
    }
  }, [menus, selected]);

  const categories = useMemo(() => {
    const present = new Set(menus.map((m) => m.category));
    return ["Semua", ...CATEGORY_ORDER.filter((c) => present.has(c))];
  }, [menus]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = menus.filter(
      (m) =>
        (activeCategory === "Semua" || m.category === activeCategory) &&
        (!q ||
          m.name.toLowerCase().includes(q) ||
          (m.description ?? "").toLowerCase().includes(q)),
    );
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: filtered
        .filter((m) => m.category === category)
        .sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable)),
    })).filter((g) => g.items.length > 0);
  }, [menus, activeCategory, query]);

  return (
    <div className="min-h-dvh pb-28">
      <CustomerHeader table={table} />

      <div className="mx-auto max-w-2xl">
        {/* Banner status pesanan aktif & pencarian */}
        <section className="px-4 pt-4">
          {hydrated && lastOrder && (
            <Link
              href={`/order/${table.id}/status/${lastOrder.orderId}`}
              className="mb-3 flex items-center justify-between rounded-lg border border-[#60C1E5] bg-white px-3.5 py-2.5 text-xs text-[#1B365D]"
            >
              <span>
                Pesanan aktif: <strong className="font-mono">{lastOrder.orderNumber}</strong>
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#005A9C]">
                Lihat Status <ChevronRight className="size-3.5" />
              </span>
            </Link>
          )}

          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari menu kopi, makanan, atau snack…"
              className="h-10 rounded-lg bg-white pl-9 text-sm"
              type="search"
            />
          </div>
        </section>

        {/* Tab kategori bergaris bawah (clean editorial style, tanpa emoji) */}
        <nav className="sticky top-14 z-20 mt-3 border-b border-[#CFE8F3] bg-white/95 backdrop-blur">
          <div className="scrollbar-none flex gap-5 overflow-x-auto px-4">
            {categories.map((c) => {
              const active = activeCategory === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCategory(c)}
                  className={cn(
                    "relative shrink-0 py-3 text-xs font-semibold tracking-wide transition-colors",
                    active ? "text-[#1B365D]" : "text-[#466585] hover:text-[#1B365D]",
                  )}
                >
                  {c === "Semua" ? "Semua Menu" : (CATEGORY_LABEL[c] ?? c)}
                  {active && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#005A9C]" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Daftar Menu */}
        <div className="space-y-7 px-4 pt-5">
          {grouped.length === 0 && (
            <p className="text-muted-foreground py-16 text-center text-sm">
              Tidak ada menu yang cocok dengan pencarian Anda.
            </p>
          )}
          {grouped.map((group) => (
            <section key={group.category}>
              <div className="mb-3 flex items-baseline justify-between border-b border-[#CFE8F3] pb-1.5">
                <h2 className="text-sm font-bold tracking-wide text-[#1B365D] uppercase">
                  {CATEGORY_LABEL[group.category] ?? group.category}
                </h2>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {group.items.length} menu
                </span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {group.items.map((menu) => (
                  <MenuCard key={menu.id} menu={menu} onSelect={() => setSelected(menu)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <AddToCartDialog menu={selected} onClose={() => setSelected(null)} />

      {/* Bar keranjang bawah */}
      {hydrated && cartCount > 0 && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-[#CFE8F3] bg-white/95 px-4 pt-2.5 backdrop-blur">
          <div className="mx-auto max-w-2xl">
            <Link
              href={`/order/${table.id}/checkout`}
              className="flex items-center justify-between rounded-lg bg-[#1B365D] px-4 py-3 text-white transition-colors hover:bg-[#005A9C]"
            >
              <div className="flex items-center gap-3">
                <span className="rounded bg-[#005A9C] px-2 py-0.5 font-mono text-xs font-bold text-[#A0E0EF]">
                  {cartCount} item
                </span>
                <span className="text-sm font-bold">{formatRupiah(cartTotal)}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold">
                Lanjut Bayar <ChevronRight className="size-4" />
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuCard({ menu, onSelect }: { menu: MenuDTO; onSelect: () => void }) {
  const soldOut = !menu.isAvailable;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={soldOut}
      className={cn(
        "flex w-full gap-3 rounded-xl border border-[#CFE8F3] bg-white p-2.5 text-left transition-colors",
        soldOut
          ? "cursor-not-allowed opacity-55"
          : "hover:border-[#005A9C]",
      )}
    >
      <div className="relative shrink-0">
        <MenuImage
          src={menu.imageUrl}
          alt={menu.name}
          category={menu.category}
          className={cn("size-20 rounded-lg", soldOut && "grayscale")}
          sizes="80px"
        />
        {soldOut && (
          <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/55 font-mono text-[10px] font-bold tracking-wider text-white">
            HABIS
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="line-clamp-1 text-sm font-bold text-[#1B365D]">{menu.name}</p>
        {menu.description && (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-snug">
            {menu.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <PriceTag price={menu.price} promoPrice={menu.promoPrice} className="text-sm" />
          {!soldOut && (
            <span className="inline-flex h-7 items-center gap-1 rounded-md border border-[#1B365D] px-2.5 text-xs font-semibold text-[#1B365D]">
              <Plus className="size-3.5" /> Tambah
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function AddToCartDialog({ menu, onClose }: { menu: MenuDTO | null; onClose: () => void }) {
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (menu) {
      setQuantity(1);
      setNotes("");
    }
  }, [menu]);

  const unitPrice = menu ? getEffectivePrice(menu) : 0;

  const toggleQuickNote = (note: string) => {
    setNotes((current) => {
      const parts = current
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const next = parts.includes(note) ? parts.filter((p) => p !== note) : [...parts, note];
      return next.join(", ").slice(0, 200);
    });
  };

  const handleAdd = () => {
    if (!menu) return;
    addItem(
      {
        menuId: menu.id,
        name: menu.name,
        unitPrice,
        imageUrl: menu.imageUrl,
        notes,
      },
      quantity,
    );
    toast.success(`${quantity}× ${menu.name} ditambahkan`);
    onClose();
  };

  return (
    <Dialog open={!!menu} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {menu && (
          <>
            <div className="flex gap-3.5">
              <MenuImage
                src={menu.imageUrl}
                alt={menu.name}
                category={menu.category}
                className="size-24 shrink-0 rounded-xl border border-[#CFE8F3]"
                sizes="96px"
              />
              <DialogHeader className="min-w-0 flex-1 pr-6">
                <DialogTitle className="text-base leading-snug text-[#1B365D]">
                  {menu.name}
                </DialogTitle>
                {menu.description && (
                  <DialogDescription className="text-xs leading-relaxed">
                    {menu.description}
                  </DialogDescription>
                )}
                <PriceTag
                  price={menu.price}
                  promoPrice={menu.promoPrice}
                  className="pt-1 text-base"
                />
              </DialogHeader>
            </div>

            <div className="space-y-2 border-t border-[#CFE8F3] pt-3">
              <Label htmlFor="item-notes" className="text-xs">
                Catatan Khusus <span className="text-muted-foreground font-normal">(opsional)</span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_NOTES.map((note) => {
                  const active = notes
                    .split(",")
                    .map((p) => p.trim())
                    .includes(note);
                  return (
                    <button
                      key={note}
                      type="button"
                      onClick={() => toggleQuickNote(note)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                        active
                          ? "border-[#005A9C] bg-[#E3F5FB] text-[#1B365D]"
                          : "border-[#CFE8F3] bg-white text-[#466585]",
                      )}
                    >
                      {note}
                    </button>
                  );
                })}
              </div>
              <Textarea
                id="item-notes"
                value={notes}
                maxLength={200}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: less sugar, es dipisah"
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center rounded-lg border border-[#CFE8F3] bg-white">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Kurangi"
                >
                  <Minus />
                </Button>
                <span className="w-8 text-center font-mono text-sm font-bold">{quantity}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                  aria-label="Tambah"
                >
                  <Plus />
                </Button>
              </div>
              <Button size="lg" className="flex-1 text-sm" onClick={handleAdd}>
                Tambah · {formatRupiah(unitPrice * quantity)}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
