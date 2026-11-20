import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { firstZodError, menuPatchSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/menus/[id] — edit menu / toggle Tersedia-Habis (Admin). */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = menuPatchSchema.safeParse(raw);
  if (!raw || !parsed.success) {
    return NextResponse.json(
      { error: parsed.success ? "Data tidak valid." : firstZodError(parsed.error) },
      { status: 400 },
    );
  }

  const existing = await prisma.menu.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Menu tidak ditemukan." }, { status: 404 });
  }

  // Hanya field yang benar-benar dikirim yang diperbarui.
  const data: Prisma.MenuUpdateInput = {};
  for (const key of Object.keys(parsed.data) as (keyof typeof parsed.data)[]) {
    if (key in raw) (data as Record<string, unknown>)[key] = parsed.data[key];
  }

  const price = (data.price as number | undefined) ?? existing.price;
  const promoPrice =
    "promoPrice" in data ? (data.promoPrice as number | null) : existing.promoPrice;
  if (promoPrice != null && promoPrice >= price) {
    return NextResponse.json(
      { error: "Harga promo harus lebih kecil dari harga normal." },
      { status: 400 },
    );
  }

  const menu = await prisma.menu.update({ where: { id }, data });
  return NextResponse.json({ menu });
}

/** DELETE /api/menus/[id] — hapus menu (Admin). */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    await prisma.menu.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Menu tidak ditemukan." }, { status: 404 });
      }
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            error:
              "Menu ini sudah tercatat di riwayat pesanan sehingga tidak bisa dihapus. Ubah statusnya menjadi Habis.",
          },
          { status: 409 },
        );
      }
    }
    console.error("[DELETE /api/menus/:id]", error);
    return NextResponse.json({ error: "Gagal menghapus menu." }, { status: 500 });
  }
}
