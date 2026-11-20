import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { firstZodError, menuSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

const menuSelect = {
  id: true,
  name: true,
  description: true,
  category: true,
  price: true,
  promoPrice: true,
  imageUrl: true,
  isAvailable: true,
} as const;

/** GET /api/menus — publik (katalog pelanggan & sinkron status Tersedia/Habis). */
export async function GET() {
  const menus = await prisma.menu.findMany({
    select: menuSelect,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ menus }, { headers: { "Cache-Control": "no-store" } });
}

/** POST /api/menus — tambah menu (Admin). */
export async function POST(request: NextRequest) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const parsed = menuSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const menu = await prisma.menu.create({
    data: {
      ...parsed.data,
      promoPrice: parsed.data.promoPrice ?? null,
      isAvailable: parsed.data.isAvailable ?? true,
    },
    select: menuSelect,
  });
  return NextResponse.json({ menu }, { status: 201 });
}
