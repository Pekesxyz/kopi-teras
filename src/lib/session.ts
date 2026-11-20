/**
 * Utilitas token sesi (JWT HS256 menggunakan Web Crypto API `crypto.subtle`).
 * 100% kompatibel dengan Edge Runtime (middleware) maupun Node.js Runtime.
 */
import { ROLES, type RoleValue } from "./constants";

export const SESSION_COOKIE = "kt_session";
export const SESSION_MAX_AGE = 60 * 60 * 14; // 14 jam (cukup untuk 1 shift + lembur)

export type SessionPayload = {
  userId: string;
  username: string;
  name: string;
  role: RoleValue;
};

type JwtClaims = SessionPayload & {
  iat: number;
  exp: number;
};

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getHmacKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET belum diset (minimal 16 karakter). Lihat .env.example.");
  }
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })),
  );
  const body = base64UrlEncode(
    new TextEncoder().encode(
      JSON.stringify({
        ...payload,
        iat: now,
        exp: now + SESSION_MAX_AGE,
      } satisfies JwtClaims),
    ),
  );
  const signingInput = `${header}.${body}`;
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, bodyB64, sigB64] = parts;

  try {
    const key = await getHmacKey();
    const sigBytes = base64UrlDecode(sigB64);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes.buffer as ArrayBuffer,
      new TextEncoder().encode(`${headerB64}.${bodyB64}`),
    );
    if (!valid) return null;

    const claims = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(bodyB64)),
    ) as Partial<JwtClaims>;
    const now = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== "number" || claims.exp <= now) return null;

    const role = claims.role as RoleValue;
    if (
      typeof claims.userId !== "string" ||
      typeof claims.username !== "string" ||
      !(ROLES as readonly string[]).includes(role)
    ) {
      return null;
    }

    return {
      userId: claims.userId,
      username: claims.username,
      name: typeof claims.name === "string" ? claims.name : claims.username,
      role,
    };
  } catch {
    return null;
  }
}

/** Role yang boleh mengakses tiap area dashboard (dipisah ketat per role). */
export const DASHBOARD_ACCESS: { prefix: string; roles: RoleValue[] }[] = [
  { prefix: "/dashboard/admin", roles: ["ADMIN"] },
  { prefix: "/dashboard/cashier", roles: ["CASHIER"] },
  { prefix: "/dashboard/kitchen", roles: ["KITCHEN"] },
];
