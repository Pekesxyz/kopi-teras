import { NextResponse, type NextRequest } from "next/server";
import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { isOrderStatus } from "@/lib/constants";
import { orderInclude, toOrderDTO, toPublicOrderDTO } from "@/lib/orders";
import { getEffectivePrice, getJakartaDateStamp } from "@/lib/utils";
import { createOrderSchema, firstZodError } from "@/lib/validators";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders?status=PENDING_VERIFICATION,PROCESSING
 * Daftar pesanan untuk dashboard staf (urut FIFO berdasarkan waktu masuk).
 */
export async function GET(request: NextRequest) {
  const auth = await requireApiRole(["CASHIER", "KITCHEN", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const statusParam = request.nextUrl.searchParams.get("status");
  const statuses = (statusParam ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(isOrderStatus) as OrderStatus[];

  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? 100);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 300) : 100;

  const orders = await prisma.order.findMany({
    where: statuses.length ? { status: { in: statuses } } : undefined,
    include: orderInclude,
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  return NextResponse.json({ orders: orders.map(toOrderDTO) });
}

/**
 * POST /api/orders — dibuat oleh pelanggan dari halaman checkout.
 * Harga dihitung ulang di server (tidak mempercayai harga dari client).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  const table = await prisma.table.findUnique({ where: { id: input.tableId } });
  if (!table || !table.isActive) {
    return NextResponse.json(
      { error: "Meja tidak ditemukan atau sedang tidak aktif. Silakan hubungi kasir." },
      { status: 404 },
    );
  }

  const menuIds = [...new Set(input.items.map((i) => i.menuId))];
  const menus = await prisma.menu.findMany({ where: { id: { in: menuIds } } });
  const menuMap = new Map(menus.map((m) => [m.id, m]));

  const unavailable: string[] = [];
  for (const id of menuIds) {
    const menu = menuMap.get(id);
    if (!menu) unavailable.push("(menu sudah dihapus)");
    else if (!menu.isAvailable) unavailable.push(menu.name);
  }
  if (unavailable.length) {
    return NextResponse.json(
      {
        error: `Menu berikut sedang habis: ${unavailable.join(", ")}. Hapus dari keranjang untuk melanjutkan.`,
        unavailableMenuIds: menuIds.filter((id) => !menuMap.get(id)?.isAvailable),
      },
      { status: 409 },
    );
  }

  const items = input.items.map((item) => {
    const menu = menuMap.get(item.menuId)!;
    return {
      menuId: menu.id,
      quantity: item.quantity,
      unitPrice: getEffectivePrice(menu),
      notes: item.notes,
    };
  });
  const totalAmount = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  // Nomor pesanan harian: KT-YYYYMMDD-001. Retry bila terjadi tabrakan (pesanan bersamaan).
  const prefix = `KT-${getJakartaDateStamp()}-`;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const order = await prisma.$transaction(async (tx) => {
        const last = await tx.order.findFirst({
          where: { orderNumber: { startsWith: prefix } },
          orderBy: { orderNumber: "desc" },
          select: { orderNumber: true },
        });
        const lastSeq = last ? Number(last.orderNumber.slice(prefix.length)) || 0 : 0;
        const orderNumber = `${prefix}${String(lastSeq + 1 + attempt).padStart(3, "0")}`;

        return tx.order.create({
          data: {
            orderNumber,
            tableId: table.id,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            paymentProofUrl: input.paymentProofUrl,
            totalAmount,
            items: { create: items },
          },
          include: orderInclude,
        });
      });
      return NextResponse.json({ order: toPublicOrderDTO(order) }, { status: 201 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        continue; // orderNumber bentrok, coba lagi
      }
      console.error("[POST /api/orders]", error);
      return NextResponse.json({ error: "Gagal menyimpan pesanan. Coba lagi." }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Sistem sedang sibuk, silakan coba kirim ulang pesanan." },
    { status: 503 },
  );
}
