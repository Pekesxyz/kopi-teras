import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { firstZodError, tablePatchSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/tables/[id] — aktif/nonaktifkan meja atau ubah lokasi (Admin). */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = tablePatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  try {
    const table = await prisma.table.update({
      where: { id },
      data: parsed.data,
      include: { _count: { select: { orders: true } } },
    });
    return NextResponse.json({ table });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Meja tidak ditemukan." }, { status: 404 });
    }
    throw error;
  }
}

/** DELETE /api/tables/[id] — hapus meja yang belum pernah dipakai (Admin). */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    await prisma.table.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Meja tidak ditemukan." }, { status: 404 });
      }
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            error:
              "Meja ini memiliki riwayat pesanan sehingga tidak bisa dihapus. Nonaktifkan saja mejanya.",
          },
          { status: 409 },
        );
      }
    }
    console.error("[DELETE /api/tables/:id]", error);
    return NextResponse.json({ error: "Gagal menghapus meja." }, { status: 500 });
  }
}
