import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { saveTableQrFile } from "@/lib/qr-files";
import { firstZodError, tableSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** GET /api/tables — daftar meja (Admin). */
export async function GET() {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const tables = await prisma.table.findMany({
    orderBy: [{ location: "asc" }, { tableNumber: "asc" }],
    include: { _count: { select: { orders: true } } },
  });
  return NextResponse.json({ tables });
}

/** POST /api/tables — tambah meja (Admin). */
export async function POST(request: NextRequest) {
  const auth = await requireApiRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const parsed = tableSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  try {
    const table = await prisma.table.create({
      data: parsed.data,
      include: { _count: { select: { orders: true } } },
    });
    await saveTableQrFile(table, request.nextUrl.origin).catch(() => {});
    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: `Nomor meja ${parsed.data.tableNumber} sudah terdaftar.` },
        { status: 409 },
      );
    }
    console.error("[POST /api/tables]", error);
    return NextResponse.json({ error: "Gagal menambah meja." }, { status: 500 });
  }
}
