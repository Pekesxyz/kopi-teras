import "server-only";
import path from "node:path";

/** Folder root penyimpanan file unggahan. File disajikan lewat `/api/files/[...path]`. */
export function getUploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads"));
}

export const UPLOAD_MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

/** Cek "magic bytes" agar file yang diunggah benar-benar gambar. */
export function looksLikeImage(buffer: Buffer) {
  if (buffer.length < 12) return false;
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return true;
  // WEBP: "RIFF....WEBP"
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP")
    return true;
  // HEIC/HEIF: "....ftyp"
  if (buffer.toString("ascii", 4, 8) === "ftyp") return true;
  return false;
}
