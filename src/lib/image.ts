/**
 * Kompres gambar di sisi browser sebelum diunggah (penting untuk koneksi outdoor
 * yang lemah). Jika browser gagal men-decode (mis. HEIC di Chrome), file asli dipakai.
 */
export async function compressImage(file: File, maxSize = 1600, quality = 0.8): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  // File kecil tidak perlu dikompres.
  if (file.size < 300 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "bukti-bayar";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
