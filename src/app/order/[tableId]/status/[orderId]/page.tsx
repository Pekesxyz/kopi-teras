import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { orderInclude, toPublicOrderDTO } from "@/lib/orders";
import { InvalidTable } from "@/components/customer/invalid-table";
import { OrderStatusTracker } from "./order-status-tracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Status Pesanan" };

type Props = { params: Promise<{ tableId: string; orderId: string }> };

export default async function OrderStatusPage({ params }: Props) {
  const { tableId, orderId } = await params;

  const order = /^[a-zA-Z0-9_-]{1,64}$/.test(orderId)
    ? await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude })
    : null;

  if (!order || order.tableId !== tableId) {
    return (
      <InvalidTable
        title="Pesanan tidak ditemukan"
        message="Link status pesanan ini tidak valid. Pindai ulang QR Code di meja untuk melihat menu, atau tanyakan ke kasir."
      />
    );
  }

  return <OrderStatusTracker initialOrder={toPublicOrderDTO(order)} />;
}
