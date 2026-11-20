export class FetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new FetchError(
      (data as { error?: string }).error ?? `Terjadi kesalahan (${res.status}).`,
      res.status,
    );
  }
  return data as T;
}

/** Fetcher default untuk SWR. */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  return parseResponse<T>(res);
}

/** Helper request JSON (POST/PATCH/DELETE). */
export async function sendJson<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parseResponse<T>(res);
}

/** Unggah gambar ke `/api/upload`. Mengembalikan URL file. */
export async function uploadImage(file: File | Blob, type: "payment" | "menu", filename?: string) {
  const form = new FormData();
  form.append("file", file, filename ?? (file instanceof File ? file.name : "upload.jpg"));
  form.append("type", type);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  return parseResponse<{ url: string }>(res);
}
