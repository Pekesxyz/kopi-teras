"use client";

import { PrintPortal } from "@/components/print-portal";
import type { OrderDTO } from "@/lib/types";
import { formatDateTime, formatRupiah } from "@/lib/utils";

export type ReceiptWidth = "58" | "80";

/**
 * Komponen struk thermal (58mm / 80mm) dengan CSS `@media print`.
 * Dirender ke dalam `PrintPortal` sehingga ketika `window.print()` dipanggil,
 * hanya struk ini yang tercetak di printer kasir/dapur.
 */
export function ThermalReceipt({
  order,
  width = "80",
}: {
  order: OrderDTO | null;
  width?: ReceiptWidth;
}) {
  if (!order) return null;

  return (
    <PrintPortal pageCss={`size: ${width}mm auto; margin: 0;`}>
      <div className="receipt" data-width={width}>
        <div className="r-center">
          <div className="r-big">KOPI TERAS</div>
          <div>Self-Order · Buka 24 Jam</div>
        </div>

        <div className="r-divider" />

        <div className="r-row">
          <span>No. Order</span>
          <span className="r-bold">{order.orderNumber}</span>
        </div>
        <div className="r-row">
          <span>Meja</span>
          <span className="r-bold">
            {order.table.tableNumber} ({order.table.location})
          </span>
        </div>
        <div className="r-row">
          <span>Pelanggan</span>
          <span className="r-bold">{order.customerName}</span>
        </div>
        <div className="r-row">
          <span>Waktu</span>
          <span>{formatDateTime(order.createdAt)}</span>
        </div>

        <div className="r-divider" />

        {order.items.map((item) => (
          <div key={item.id} style={{ marginBottom: "4px" }}>
            <div className="r-bold">{item.name}</div>
            <div className="r-row">
              <span>
                {item.quantity} x {formatRupiah(item.unitPrice)}
              </span>
              <span>{formatRupiah(item.quantity * item.unitPrice)}</span>
            </div>
            {item.notes && <div style={{ fontStyle: "italic" }}>* Catatan: {item.notes}</div>}
          </div>
        ))}

        <div className="r-divider" />

        <div className="r-row r-big">
          <span>TOTAL</span>
          <span>{formatRupiah(order.totalAmount)}</span>
        </div>
        <div className="r-row">
          <span>Metode</span>
          <span className="r-bold">QRIS (LUNAS)</span>
        </div>

        <div className="r-divider" />

        <div className="r-center" style={{ marginTop: "4px" }}>
          <div className="r-bold">AMBIL PESANAN DI KONTER</div>
          <div>Terima kasih sudah nongkrong di Kopi Teras!</div>
        </div>
      </div>
    </PrintPortal>
  );
}
