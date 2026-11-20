import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireApiRole } from "@/lib/auth";
import { canTransition, ORDER_STATUS_META } from "@/lib/constants";
import { orderInclude, toOrderDTO, toPublicOrderDTO } from "@/lib/orders";
import { firstZodError, updateOrderStatusSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/orders/[id]
 * Publik untuk halaman tracking pelanggan (data sensitif disembunyikan).
 * Staf yang login mendapat data lengkap.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  const session = await getSession();
  return NextResponse.json(
    { order: session ? toOrderDTO(order) : toPublicOrderDTO(order) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * PATCH /api/orders/[id]  body: { status }
 * Perubahan status oleh staf sesuai aturan transisi & role.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireApiRole(["CASHIER", "KITCHEN", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = updateOrderStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }
  const nextStatus = parsed.data.status;

  const current = await prisma.order.findUnique({ where: { id }, select: { status: true } });
  if (!current) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  if (!canTransition(current.status, nextStatus, auth.session.role)) {
    return NextResponse.json(
      {
        error: `Tidak dapat mengubah status dari "${ORDER_STATUS_META[current.status].label}" ke "${ORDER_STATUS_META[nextStatus].label}".`,
      },
      { status: 409 },
    );
  }

  // Update bersyarat: mencegah race condition (mis. dua kasir menekan tombol bersamaan).
  const result = await prisma.order.updateMany({
    where: { id, status: current.status },
    data: { status: nextStatus },
  });
  if (result.count === 0) {
    return NextResponse.json(
      { error: "Status pesanan sudah diubah oleh staf lain. Muat ulang data." },
      { status: 409 },
    );
  }

  const order = await prisma.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
  return NextResponse.json({ order: toOrderDTO(order) });
}
