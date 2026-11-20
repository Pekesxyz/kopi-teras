import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME } from "@/lib/constants";
import { DASHBOARD_ACCESS, SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  // Staf yang sudah login tidak perlu melihat halaman login lagi.
  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
    }
    return NextResponse.next();
  }

  // Semua route /dashboard wajib login.
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    const response = NextResponse.redirect(loginUrl);
    // Bersihkan cookie yang kedaluwarsa/rusak.
    if (request.cookies.has(SESSION_COOKIE)) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  const rule = DASHBOARD_ACCESS.find((r) => pathname.startsWith(r.prefix));
  if (rule && !rule.roles.includes(session.role)) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
