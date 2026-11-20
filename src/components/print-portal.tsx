"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Merender konten cetak langsung di bawah <body> (class .print-root).
 * CSS @media print di globals.css menyembunyikan semua elemen lain,
 * sehingga hanya konten ini yang tercetak.
 *
 * `pageCss` contoh: "size: 80mm auto; margin: 0;" untuk struk thermal.
 */
export function PrintPortal({ children, pageCss }: { children: ReactNode; pageCss: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="print-root">
      <style>{`@media print { @page { ${pageCss} } }`}</style>
      {children}
    </div>,
    document.body,
  );
}
