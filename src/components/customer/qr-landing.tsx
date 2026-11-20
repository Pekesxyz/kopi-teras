"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import QRCode from "qrcode";
import { toast } from "sonner";
import { ArrowUpRight, Camera, Download, ImageUp, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TableItem = {
  id: string;
  tableNumber: string;
  location: string;
};

export function QrLanding({
  tables,
  suggestedBaseUrl,
}: {
  tables: TableItem[];
  suggestedBaseUrl: string;
}) {
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedQrTable, setSelectedQrTable] = useState<TableItem | null>(null);
  const [baseUrl, setBaseUrl] = useState(suggestedBaseUrl);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const cleanBaseUrl = baseUrl.trim().replace(/\/+$/, "");

  useEffect(() => {
    if (!selectedQrTable) {
      setQrDataUrl(null);
      return;
    }
    const url = `${cleanBaseUrl}/order/${selectedQrTable.id}`;
    QRCode.toDataURL(url, {
      width: 360,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1B365D", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [selectedQrTable, cleanBaseUrl]);

  const handleDecodedText = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return false;

      const matchOrderPath = text.match(/\/order\/([a-zA-Z0-9_-]+)/);
      if (matchOrderPath?.[1]) {
        setScannerOpen(false);
        router.push(`/order/${matchOrderPath[1]}`);
        return true;
      }

      const byId = tables.find(
        (t) => t.id === text || t.tableNumber.toLowerCase() === text.toLowerCase(),
      );
      if (byId) {
        setScannerOpen(false);
        router.push(`/order/${byId.id}`);
        return true;
      }

      toast.error("Kode QR tidak dikenali sebagai meja Kopi Teras.");
      return false;
    },
    [router, tables],
  );

  return (
    <div className="space-y-6">
      {/* Bagian pindai QR */}
      <section className="rounded-xl border border-[#CFE8F3] bg-white p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[11px] font-semibold tracking-wider text-[#005A9C] uppercase">
              Self-Order · Tanpa Login
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-[#1B365D]">
              Pesan dari Meja Anda
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Pindai kode QR pada meja untuk membuka menu dan memesan langsung.
            </p>
          </div>
          <Button size="lg" className="shrink-0" onClick={() => setScannerOpen(true)}>
            <Camera className="size-4" /> Pindai QR Meja
          </Button>
        </div>
      </section>

      {/* Daftar meja */}
      <section className="rounded-xl border border-[#CFE8F3] bg-white p-5">
        <div className="border-b border-[#CFE8F3] pb-3">
          <h2 className="text-sm font-bold text-[#1B365D]">Pilih Nomor Meja</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Klik nomor meja untuk langsung membuka menu, atau klik ikon QR untuk melihat kode QR
            meja tersebut.
          </p>
        </div>

        <div className="mt-4 space-y-5">
          {tables.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Data meja belum tersedia.
            </p>
          ) : (
            (["Indoor", "Outdoor"] as const).map((loc) => {
              const list = tables.filter((t) => t.location === loc);
              if (list.length === 0) return null;
              return (
                <div key={loc} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold tracking-wider text-[#466585] uppercase">
                      Area {loc}
                    </span>
                    <span className="text-muted-foreground text-xs">{list.length} meja</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {list.map((table) => (
                      <div
                        key={table.id}
                        className="flex items-center justify-between rounded-lg border border-[#CFE8F3] bg-[#F4FAFD] p-1 pl-3"
                      >
                        <Link
                          href={`/order/${table.id}`}
                          className="flex flex-1 items-center gap-1 py-1 font-mono text-sm font-bold text-[#1B365D] hover:text-[#005A9C]"
                        >
                          <span>{table.tableNumber}</span>
                          <ArrowUpRight className="size-3.5 opacity-60" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSelectedQrTable(table)}
                          className="hover:bg-[#A0E0EF]/50 grid size-7 place-items-center rounded-md border border-[#CFE8F3] bg-white text-[#1B365D] transition-colors"
                          title={`Lihat QR Meja ${table.tableNumber}`}
                        >
                          <QrCode className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Dialog Kamera & Upload Scanner QR */}
      <QrCameraScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleDecodedText}
      />

      {/* Dialog Stiker QR Meja */}
      <Dialog open={!!selectedQrTable} onOpenChange={(o) => !o && setSelectedQrTable(null)}>
        <DialogContent className="sm:max-w-sm">
          {selectedQrTable && (
            <>
              <DialogHeader>
                <DialogTitle>Meja {selectedQrTable.tableNumber}</DialogTitle>
                <DialogDescription>
                  Area {selectedQrTable.location} · Pindai kode QR ini menggunakan kamera ponsel.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center rounded-xl border border-[#1B365D] bg-white p-5 text-center">
                <p className="text-base font-bold tracking-tight text-[#1B365D]">Kopi Teras.</p>
                <p className="mt-0.5 font-mono text-xs font-semibold text-[#005A9C]">
                  MEJA {selectedQrTable.tableNumber} · {selectedQrTable.location.toUpperCase()}
                </p>

                <div className="my-3 grid size-52 place-items-center">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt={`QR Meja ${selectedQrTable.tableNumber}`}
                      className="size-full object-contain"
                    />
                  ) : (
                    <Loader2 className="text-muted-foreground size-6 animate-spin" />
                  )}
                </div>

                <p className="font-mono text-[11px] break-all text-[#466585]">
                  {cleanBaseUrl}/order/{selectedQrTable.id}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qr-lan-url" className="text-xs">
                  Alamat Server (untuk pemindaian via Wi-Fi lokal)
                </Label>
                <Input
                  id="qr-lan-url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="h-8 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {qrDataUrl && (
                  <Button asChild variant="outline" size="sm">
                    <a href={qrDataUrl} download={`QR-Meja-${selectedQrTable.tableNumber}.png`}>
                      <Download /> Unduh PNG
                    </a>
                  </Button>
                )}
                <Button asChild size="sm" className="w-full">
                  <Link href={`/order/${selectedQrTable.id}`}>
                    Buka Meja {selectedQrTable.tableNumber}
                  </Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QrCameraScannerDialog({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (text: string) => boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let stream: MediaStream | null = null;
    let rafId = 0;
    let active = true;

    async function startCamera() {
      setStarting(true);
      setCameraError(null);
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Akses kamera tidak didukung.");
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        setStarting(false);

        const tick = () => {
          if (!active) return;
          const v = videoRef.current;
          const c = canvasRef.current;
          if (v && c && v.readyState === v.HAVE_ENOUGH_DATA) {
            c.width = v.videoWidth;
            c.height = v.videoHeight;
            const ctx = c.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(v, 0, 0, c.width, c.height);
              const imageData = ctx.getImageData(0, 0, c.width, c.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });
              if (code?.data) {
                const ok = onDetected(code.data);
                if (ok) return;
              }
            }
          }
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      } catch {
        setStarting(false);
        setCameraError(
          "Kamera tidak dapat diakses. Anda dapat memilih file gambar kode QR dari perangkat.",
        );
      }
    }

    startCamera();

    return () => {
      active = false;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, onDetected]);

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data) {
        onDetected(code.data);
      } else {
        toast.error("Tidak ditemukan kode QR pada gambar tersebut.");
      }
    } catch {
      toast.error("Gagal membaca file gambar.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Pindai QR Meja</DialogTitle>
          <DialogDescription>
            Arahkan kamera ke stiker QR pada meja atau unggah gambar QR.
          </DialogDescription>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-xl border bg-black">
          <video ref={videoRef} playsInline muted className="aspect-square w-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {!cameraError && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="size-48 rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
            </div>
          )}

          {starting && (
            <div className="absolute inset-0 grid place-items-center bg-black/70 text-white">
              <div className="flex flex-col items-center gap-2 text-xs">
                <Loader2 className="size-5 animate-spin" />
                <span>Membuka kamera…</span>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="flex aspect-square items-center justify-center bg-[#10233E] p-6 text-center text-xs leading-relaxed text-white/80">
              {cameraError}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFileUpload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageUp /> Pilih Gambar QR dari Perangkat
        </Button>
      </DialogContent>
    </Dialog>
  );
}
