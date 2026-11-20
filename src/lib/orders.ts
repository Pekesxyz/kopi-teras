import "server-only";
import type { Prisma } from "@prisma/client";
import type { OrderDTO, PublicOrderDTO } from "./types";

export const orderInclude = {
  table: { select: { id: true, tableNumber: true, location: true } },
  items: { include: { menu: { select: { name: true } } } },
} satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export function toOrderDTO(order: OrderWithRelations): OrderDTO {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    totalAmount: order.totalAmount,
    paymentProofUrl: order.paymentProofUrl,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    table: order.table,
    items: order.items.map((item) => ({
      id: item.id,
      menuId: item.menuId,
      name: item.menu.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      notes: item.notes,
    })),
  };
}

export function toPublicOrderDTO(order: OrderWithRelations): PublicOrderDTO {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { customerEmail, paymentProofUrl, ...rest } = toOrderDTO(order);
  return rest;
}
