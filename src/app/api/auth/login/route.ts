import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ROLE_HOME } from "@/lib/constants";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username wajib diisi.").max(50),
  password: z.string().min(1, "Password wajib diisi.").max(200),
});

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data login tidak valid." },
      { status: 400 },
    );
  }

  const { username, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });

  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) {
    return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
  }

  const token = await createSessionToken({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
    redirectTo: ROLE_HOME[user.role],
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}
