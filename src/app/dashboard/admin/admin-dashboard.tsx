"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import useSWR from "swr";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  Download,
  ExternalLink,
  ImageUp,
  Loader2,
  Pencil,
  Plus,
  Printer,
  QrCode,
  Search,
  Tag,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MenuImage } from "@/components/menu-image";
import { PriceTag } from "@/components/customer/customer-header";
import { PrintPortal } from "@/components/print-portal";
import { MENU_CATEGORIES, TABLE_LOCATIONS, type MenuCategory } from "@/lib/constants";
import { fetcher, FetchError, sendJson, uploadImage } from "@/lib/fetcher";
import { compressImage } from "@/lib/image";
import type { MenuDTO, TableDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AdminDashboard({
  initialMenus,
  initialTables,
  defaultBaseUrl,
}: {
  initialMenus: MenuDTO[];
  initialTables: TableDTO[];
  defaultBaseUrl: string;
}) {
  const { data: menuData, mutate: mutateMenus } = useSWR<{ menus: MenuDTO[] }>(
    "/api/menus",
    fetcher,
    { fallbackData: { menus: initialMenus } },
  );
  const { data: tableData, mutate: mutateTables } = useSWR<{ tables: TableDTO[] }>(
    "/api/tables",
    fetcher,
    { fallbackData: { tables: initialTables } },
  );

  const menus = useMemo(() => menuData?.menus ?? initialMenus, [menuData, initialMenus]);
  const tables = useMemo(() => tableData?.tables ?? initialTables, [tableData, initialTables]);

  // ---------------- State Menu CRUD ----------------
  const [categoryFilter, setCategoryFilter] = useState<string>("Semua");
  const [search, setSearch] = useState("");
  const [editingMenu, setEditingMenu] = useState<MenuDTO | null>(null);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);

  const filteredMenus = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menus.filter(
      (m) =>
        (categoryFilter === "Semua" || m.category === categoryFilter) &&
        (!q ||
          m.name.toLowerCase().includes(q) ||
          (m.description ?? "").toLowerCase().includes(q)),
    );
  }, [menus, categoryFilter, search]);

  const stats = useMemo(() => {
    const available = menus.filter((m) => m.isAvailable).length;
    const promo = menus.filter(
      (m) => m.category === "Promo" || (m.promoPrice != null && m.promoPrice < m.price),
    ).length;
    return {
      total: menus.length,
      available,
      soldOut: menus.length - available,
      promo,
    };
  }, [menus]);

  const handleToggleMenuAvailability = async (menu: MenuDTO, isAvailable: boolean) => {
    // Optimistic update agar kasir & pelanggan langsung melihat perubahan.
    await mutateMenus(
      { menus: menus.map((m) => (m.id === menu.id ? { ...m, isAvailable } : m)) },
      { revalidate: false },
    );
    try {
      await sendJson(`/api/menus/${menu.id}`, "PATCH", { isAvailable });
      toast.success(
        `${menu.name} diubah menjadi ${isAvailable ? "Tersedia" : "Habis (Stok Kosong)"}.`,
      );
      mutateMenus();
    } catch (error) {
      toast.error(error instanceof FetchError ? error.message : "Gagal mengubah status menu.");
      mutateMenus();
    }
  };

  const handleDeleteMenu = async (menu: MenuDTO) => {
    if (!window.confirm(`Hapus menu "${menu.name}"?`)) return;
    try {
      await sendJson(`/api/menus/${menu.id}`, "DELETE");
      toast.success(`Menu "${menu.name}" dihapus.`);
      mutateMenus();
    } catch (error) {
      toast.error(error instanceof FetchError ? error.message : "Gagal menghapus menu.");
    }
  };

  // ---------------- State Meja & QR Generator ----------------
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  useEffect(() => {
    if (typeof window !== "undefined" && defaultBaseUrl.includes("localhost")) {
      setBaseUrl(window.location.origin);
    }
  }, [defaultBaseUrl]);

  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableLocation, setNewTableLocation] = useState<(typeof TABLE_LOCATIONS)[number]>("Indoor");
  const [addingTable, setAddingTable] = useState(false);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [printTables, setPrintTables] = useState<TableDTO[]>([]);

  const cleanBaseUrl = baseUrl.trim().replace(/\/+$/, "");

  // Generate QR Data URL untuk semua meja setiap kali daftar meja atau baseUrl berubah.
  useEffect(() => {
    let cancelled = false;
    async function generateAll() {
      const entries = await Promise.all(
        tables.map(async (t) => {
          const url = `${cleanBaseUrl}/order/${t.id}`;
          const dataUrl = await QRCode.toDataURL(url, {
            width: 360,
            margin: 1,
            errorCorrectionLevel: "M",
            color: { dark: "#1B365D", light: "#ffffff" },
          });
          return [t.id, dataUrl] as const;
        }),
      );
      if (!cancelled) setQrMap(Object.fromEntries(entries));
    }
    generateAll();
    return () => {
      cancelled = true;
    };
  }, [tables, cleanBaseUrl]);

  const handleAddTable = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim() || addingTable) return;
    setAddingTable(true);
    try {
      await sendJson("/api/tables", "POST", {
        tableNumber: newTableNumber.trim().toUpperCase(),
        location: newTableLocation,
      });
      toast.success(`Meja ${newTableNumber.toUpperCase()} ditambahkan.`);
      setNewTableNumber("");
      mutateTables();
    } catch (error) {
      toast.error(error instanceof FetchError ? error.message : "Gagal menambah meja.");
    } finally {
      setAddingTable(false);
    }
  };

  const handleToggleTable = async (table: TableDTO, isActive: boolean) => {
    try {
      await sendJson(`/api/tables/${table.id}`, "PATCH", { isActive });
      toast.success(`Meja ${table.tableNumber} ${isActive ? "diaktifkan" : "dinonaktifkan"}.`);
      mutateTables();
    } catch (error) {
      toast.error(error instanceof FetchError ? error.message : "Gagal mengubah status meja.");
    }
  };

  const handleDeleteTable = async (table: TableDTO) => {
    if (!window.confirm(`Hapus meja ${table.tableNumber}?`)) return;
    try {
      await sendJson(`/api/tables/${table.id}`, "DELETE");
      toast.success(`Meja ${table.tableNumber} dihapus.`);
      mutateTables();
    } catch (error) {
      toast.error(error instanceof FetchError ? error.message : "Gagal menghapus meja.");
    }
  };

  const handlePrintQr = (targetTables: TableDTO[]) => {
    if (targetTables.length === 0) {
      toast.warning("Tidak ada meja untuk dicetak.");
      return;
    }
    setPrintTables(targetTables);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownloadSticker = async (table: TableDTO) => {
    const url = `${cleanBaseUrl}/order/${table.id}`;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 760;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Latar putih & bingkai
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1B365D";
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Header brand
    ctx.fillStyle = "#1B365D";
    ctx.fillRect(20, 20, canvas.width - 40, 120);
    ctx.fillStyle = "#60C1E5";
    ctx.fillRect(20, 134, canvas.width - 40, 6);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("KOPI TERAS", canvas.width / 2, 78);
    ctx.fillStyle = "#A0E0EF";
    ctx.font = "bold 20px Arial, sans-serif";
    ctx.fillText(`MEJA ${table.tableNumber} · ${table.location.toUpperCase()}`, canvas.width / 2, 115);

    // Gambar QR
    const qrCanvas = document.createElement("canvas");
    await QRCode.toCanvas(qrCanvas, url, {
      width: 420,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1B365D", light: "#ffffff" },
    });
    ctx.drawImage(qrCanvas, (canvas.width - 420) / 2, 165, 420, 420);

    // Footer instruksi
    ctx.fillStyle = "#1B365D";
    ctx.font = "bold 26px Arial, sans-serif";
    ctx.fillText("SCAN UNTUK PESAN DARI MEJA", canvas.width / 2, 635);
    ctx.fillStyle = "#005A9C";
    ctx.font = "18px Arial, sans-serif";
    ctx.fillText("Tanpa aplikasi · Bayar QRIS · Ambil di konter", canvas.width / 2, 670);
    ctx.fillStyle = "#466585";
    ctx.font = "13px monospace";
    ctx.fillText(url, canvas.width / 2, 710);

    const link = document.createElement("a");
    link.download = `QR-Kopi-Teras-${table.tableNumber}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Admin & Manajer</h1>
        <p className="text-muted-foreground text-sm">
          Kelola katalog menu, harga promo/bundling, ketersediaan stok instan, dan stiker QR Code
          meja.
        </p>
      </div>

      <Tabs defaultValue="menus">
        <TabsList>
          <TabsTrigger value="menus">
            <UtensilsCrossed /> Menu & Promo ({menus.length})
          </TabsTrigger>
          <TabsTrigger value="tables">
            <QrCode /> Meja & Generator QR ({tables.length})
          </TabsTrigger>
        </TabsList>

        {/* ================= TAB 1: MANAJEMEN MENU & PROMO ================= */}
        <TabsContent value="menus" className="space-y-5">
          {/* Stat ringkas */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="bg-card rounded-xl border p-4">
              <p className="text-muted-foreground text-xs">Total Menu</p>
              <p className="mt-1 text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <p className="text-xs text-emerald-900">Tersedia</p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">{stats.available}</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
              <p className="text-xs text-rose-900">Stok Habis</p>
              <p className="mt-1 text-2xl font-bold text-rose-900">{stats.soldOut}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <p className="text-xs text-amber-900">Promo / Bundling Aktif</p>
              <p className="mt-1 text-2xl font-bold text-amber-900">{stats.promo}</p>
            </div>
          </div>

          {/* Filter & tombol tambah */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama / deskripsi menu…"
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {["Semua", ...MENU_CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      categoryFilter === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card hover:bg-muted",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => {
                setEditingMenu(null);
                setMenuDialogOpen(true);
              }}
            >
              <Plus /> Tambah Menu / Promo
            </Button>
          </div>

          {/* Grid daftar menu */}
          {filteredMenus.length === 0 ? (
            <div className="bg-card rounded-2xl border py-16 text-center">
              <p className="font-semibold">Menu tidak ditemukan</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Coba ubah filter kategori atau tambahkan menu baru.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredMenus.map((menu) => (
                <Card key={menu.id} className="gap-3 py-4">
                  <CardContent className="flex gap-3">
                    <MenuImage
                      src={menu.imageUrl}
                      alt={menu.name}
                      category={menu.category}
                      className={cn("size-20 shrink-0 rounded-xl", !menu.isAvailable && "grayscale")}
                      sizes="80px"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant="secondary" className="text-[10px]">
                            {menu.category}
                          </Badge>
                          <h3 className="mt-1 leading-snug font-semibold">{menu.name}</h3>
                        </div>
                        {menu.promoPrice != null && menu.promoPrice < menu.price && (
                          <Badge className="bg-rose-600 text-white">
                            <Tag className="size-3" /> Promo
                          </Badge>
                        )}
                      </div>

                      {menu.description && (
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                          {menu.description}
                        </p>
                      )}

                      <PriceTag
                        price={menu.price}
                        promoPrice={menu.promoPrice}
                        className="mt-2 text-sm"
                      />
                    </div>
                  </CardContent>

                  <CardContent className="flex items-center justify-between border-t pt-3">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                      <Switch
                        checked={menu.isAvailable}
                        onCheckedChange={(checked) => handleToggleMenuAvailability(menu, checked)}
                      />
                      <span
                        className={cn(
                          menu.isAvailable ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold",
                        )}
                      >
                        {menu.isAvailable ? "Tersedia" : "Habis"}
                      </span>
                    </label>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingMenu(menu);
                          setMenuDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive size-8"
                        onClick={() => handleDeleteMenu(menu)}
                        aria-label={`Hapus ${menu.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ================= TAB 2: MEJA & GENERATOR QR CODE ================= */}
        <TabsContent value="tables" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Form tambah meja */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tambah Meja Baru</CardTitle>
                <CardDescription>
                  Contoh penomoran: <code>IN-09</code> (Indoor) atau <code>OUT-07</code> (Outdoor).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddTable} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="table-number">Nomor Meja</Label>
                    <Input
                      id="table-number"
                      value={newTableNumber}
                      onChange={(e) => setNewTableNumber(e.target.value.toUpperCase())}
                      placeholder="IN-09"
                      maxLength={20}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="table-location">Area / Lokasi</Label>
                    <select
                      id="table-location"
                      value={newTableLocation}
                      onChange={(e) =>
                        setNewTableLocation(e.target.value as (typeof TABLE_LOCATIONS)[number])
                      }
                      className="border-input flex h-10 w-full rounded-md border bg-white px-3 text-sm"
                    >
                      {TABLE_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" className="w-full" disabled={addingTable}>
                    {addingTable ? <Loader2 className="animate-spin" /> : <Plus />}
                    Tambah Meja
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Pengaturan URL QR & cetak massal */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Pengaturan URL & Cetak Stiker QR Code</CardTitle>
                <CardDescription>
                  Pastikan URL Dasar dapat diakses dari HP pelanggan (contoh IP Wi-Fi lokal kafe:{" "}
                  <code>http://192.168.1.10:3000</code> atau domain produksi).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="base-url">URL Dasar Aplikasi</Label>
                  <Input
                    id="base-url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://192.168.1.10:3000"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handlePrintQr(tables.filter((t) => t.isActive))}
                    disabled={tables.filter((t) => t.isActive).length === 0}
                  >
                    <Printer /> Cetak Semua QR Meja Aktif ({tables.filter((t) => t.isActive).length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daftar kartu QR meja */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {tables.map((table) => {
              const targetUrl = `${cleanBaseUrl}/order/${table.id}`;
              const qrSrc = qrMap[table.id];
              return (
                <Card key={table.id} className={cn("gap-3", !table.isActive && "opacity-65")}>
                  <CardHeader className="pb-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Meja {table.tableNumber}</CardTitle>
                      <Badge variant={table.location === "Indoor" ? "secondary" : "outline"}>
                        {table.location}
                      </Badge>
                    </div>
                    <CardDescription className="truncate font-mono text-[11px]" title={targetUrl}>
                      /order/{table.id}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex flex-col items-center">
                    <div className="grid size-44 place-items-center rounded-xl border bg-white p-2">
                      {qrSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element -- data URL QR
                        <img
                          src={qrSrc}
                          alt={`QR Meja ${table.tableNumber}`}
                          className="size-full object-contain"
                        />
                      ) : (
                        <Loader2 className="text-muted-foreground size-6 animate-spin" />
                      )}
                    </div>

                    <div className="mt-3 grid w-full grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadSticker(table)}
                      >
                        <Download /> PNG
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handlePrintQr([table])}>
                        <Printer /> Cetak
                      </Button>
                    </div>

                    <Button asChild variant="secondary" size="sm" className="mt-2 w-full">
                      <Link href={`/order/${table.id}`} target="_blank">
                        <ExternalLink /> Buka Halaman Meja
                      </Link>
                    </Button>
                  </CardContent>

                  <CardContent className="flex items-center justify-between border-t pt-3">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                      <Switch
                        checked={table.isActive}
                        onCheckedChange={(checked) => handleToggleTable(table, checked)}
                      />
                      <span>{table.isActive ? "Aktif" : "Nonaktif"}</span>
                    </label>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive size-8"
                      onClick={() => handleDeleteTable(table)}
                      aria-label={`Hapus meja ${table.tableNumber}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Tambah / Edit Menu */}
      <MenuFormDialog
        open={menuDialogOpen}
        menu={editingMenu}
        onClose={() => setMenuDialogOpen(false)}
        onSaved={() => {
          setMenuDialogOpen(false);
          mutateMenus();
        }}
      />

      {/* Portal cetak lembar stiker QR meja */}
      {printTables.length > 0 && (
        <PrintPortal pageCss="size: A4 portrait; margin: 10mm;">
          <div className="grid grid-cols-2 gap-6 p-2">
            {printTables.map((t) => (
              <div
                key={t.id}
                className="flex flex-col items-center rounded-2xl border-2 border-black p-5 text-center"
                style={{ breakInside: "avoid" }}
              >
                <p className="text-xl font-extrabold tracking-tight">KOPI TERAS</p>
                <p className="mt-0.5 text-sm font-bold">
                  MEJA {t.tableNumber} ({t.location})
                </p>
                {qrMap[t.id] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrMap[t.id]} alt={t.tableNumber} className="my-2 size-44" />
                )}
                <p className="text-xs font-bold">SCAN QR UNTUK PESAN DARI MEJA</p>
                <p className="text-[10px]">Bayar QRIS · Ambil di Konter</p>
              </div>
            ))}
          </div>
        </PrintPortal>
      )}
    </div>
  );
}

function MenuFormDialog({
  open,
  menu,
  onClose,
  onSaved,
}: {
  open: boolean;
  menu: MenuDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!menu;
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MenuCategory>("Coffee");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (menu) {
      setName(menu.name);
      setCategory(
        (MENU_CATEGORIES as readonly string[]).includes(menu.category)
          ? (menu.category as MenuCategory)
          : "Coffee",
      );
      setDescription(menu.description ?? "");
      setPrice(String(menu.price));
      setPromoPrice(menu.promoPrice != null ? String(menu.promoPrice) : "");
      setImageUrl(menu.imageUrl ?? "");
      setIsAvailable(menu.isAvailable);
    } else {
      setName("");
      setCategory("Coffee");
      setDescription("");
      setPrice("");
      setPromoPrice("");
      setImageUrl("");
      setIsAvailable(true);
    }
  }, [menu, open]);

  const handleUploadImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, 1000, 0.82);
      const { url } = await uploadImage(compressed, "menu");
      setImageUrl(url);
      toast.success("Gambar menu berhasil diunggah.");
    } catch (error) {
      toast.error(error instanceof FetchError ? error.message : "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(price);
    const numericPromo = promoPrice.trim() === "" ? null : Number(promoPrice);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      toast.error("Harga normal tidak valid.");
      return;
    }
    if (numericPromo != null && (!Number.isFinite(numericPromo) || numericPromo >= numericPrice)) {
      toast.error("Harga promo harus lebih kecil dari harga normal.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        description: description.trim() || null,
        price: Math.round(numericPrice),
        promoPrice: numericPromo != null ? Math.round(numericPromo) : null,
        imageUrl: imageUrl.trim() || null,
        isAvailable,
      };

      if (isEdit && menu) {
        await sendJson(`/api/menus/${menu.id}`, "PATCH", payload);
        toast.success(`Menu "${payload.name}" diperbarui.`);
      } else {
        await sendJson("/api/menus", "POST", payload);
        toast.success(`Menu "${payload.name}" ditambahkan.`);
      }
      onSaved();
    } catch (error) {
      toast.error(error instanceof FetchError ? error.message : "Gagal menyimpan menu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Menu" : "Tambah Menu / Paket Promo"}</DialogTitle>
          <DialogDescription>
            Pilih kategori <strong>Promo</strong> atau isi <strong>Harga Promo</strong> untuk
            menampilkan label diskon di halaman pelanggan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="menu-name">Nama Menu *</Label>
            <Input
              id="menu-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kopi Susu Teras"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="menu-category">Kategori *</Label>
              <select
                id="menu-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as MenuCategory)}
                className="border-input flex h-10 w-full rounded-md border bg-white px-3 text-sm"
              >
                {MENU_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Status Stok</Label>
              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border bg-white px-3 text-sm">
                <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
                <span>{isAvailable ? "Tersedia" : "Habis"}</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="menu-price">Harga Normal (Rp) *</Label>
              <Input
                id="menu-price"
                type="number"
                min={0}
                step={500}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="22000"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="menu-promo">Harga Promo (Rp, opsional)</Label>
              <Input
                id="menu-promo"
                type="number"
                min={0}
                step={500}
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value)}
                placeholder="Kosongkan jika normal"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="menu-desc">Deskripsi</Label>
            <Textarea
              id="menu-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Komposisi singkat atau isi paket promo…"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="menu-img">Gambar Menu (opsional)</Label>
            <div className="flex gap-2">
              <Input
                id="menu-img"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Unggah foto atau tempel URL https://..."
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleUploadImage(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? <Loader2 className="animate-spin" /> : <ImageUp />}
                Unggah
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={saving || uploading}>
              {saving && <Loader2 className="animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah Menu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
