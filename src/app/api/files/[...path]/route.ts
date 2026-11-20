import { NextResponse, type NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getUploadRoot, MIME_BY_EXT } from "@/lib/storage";

export const runtime = "nodejs";

type Params = { params: Promise<{ path: string[] }> };

const SAFE_SEGMENT = /^[a-zA-Z0-9._-]+$/;

/** GET /api/files/{payments|menus}/{YYYYMMDD}/{file} — menyajikan file unggahan. */
export async function GET(_request: NextRequest, { params }: Params) {
  const { path: segments } = await params;

  if (
    !segments?.length ||
    !["payments", "menus"].includes(segments[0]) ||
    segments.some((s) => !SAFE_SEGMENT.test(s) || s.startsWith("."))
  ) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });
  }

  const root = getUploadRoot();
  const filePath = path.resolve(root, ...segments);
  if (!filePath.startsWith(root + path.sep)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });
  }

  const ext = path.extname(filePath).slice(1).toLowerCase();
  const contentType = MIME_BY_EXT[ext];
  if (!contentType) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });
  }

  try {
    const data = await readFile(filePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });
  }
}
