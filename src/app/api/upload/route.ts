import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireApiRole } from "@/lib/auth";
import { ALLOWED_IMAGE_TYPES, getUploadRoot, looksLikeImage, UPLOAD_MAX_BYTES } from "@/lib/storage";
import { getJakartaDateStamp } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/upload (multipart/form-data)
 *  - file: gambar (jpg/png/webp/heic), maks 8 MB
 *  - type: "payment" (publik, bukti bayar pelanggan) | "menu" (khusus admin)
 *
 * File disimpan terstruktur: storage/uploads/{payments|menus}/{YYYYMMDD}/{uuid}.{ext}
 * dan disajikan melalui /api/files/...
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Format unggahan tidak valid." }, { status: 400 });
  }

  const type = form.get("type") === "menu" ? "menu" : "payment";
  if (type === "menu") {
    const auth = await requireApiRole(["ADMIN"]);
    if (!auth.ok) return auth.response;
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "File gambar wajib dipilih." }, { status: 400 });
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    return NextResponse.json({ error: "Ukuran file maksimal 8 MB." }, { status: 413 });
  }

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Format file harus JPG, PNG, WEBP, atau HEIC." },
      { status: 415 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!looksLikeImage(buffer)) {
    return NextResponse.json({ error: "File bukan gambar yang valid." }, { status: 415 });
  }

  const folder = type === "menu" ? "menus" : "payments";
  const dateStamp = getJakartaDateStamp();
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(getUploadRoot(), folder, dateStamp);

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
  } catch (error) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json({ error: "Gagal menyimpan file. Coba lagi." }, { status: 500 });
  }

  return NextResponse.json({ url: `/api/files/${folder}/${dateStamp}/${filename}` }, { status: 201 });
}
