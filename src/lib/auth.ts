import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { RoleValue } from "./constants";
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "./session";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

type AuthResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

/**
 * Guard untuk Route Handler API.
 * Contoh: `const auth = await requireApiRole(["CASHIER", "ADMIN"]); if (!auth.ok) return auth.response;`
 */
export async function requireApiRole(roles: RoleValue[]): Promise<AuthResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 }),
    };
  }
  if (!roles.includes(session.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Akses ditolak untuk role Anda." }, { status: 403 }),
    };
  }
  return { ok: true, session };
}
