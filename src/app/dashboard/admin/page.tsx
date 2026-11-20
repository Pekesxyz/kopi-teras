import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";
import { AdminDashboard } from "./admin-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard Admin" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") {
    redirect(ROLE_HOME[session.role]);
  }

  const [menus, tables] = await Promise.all([
    prisma.menu.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        promoPrice: true,
        imageUrl: true,
        isAvailable: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.table.findMany({
      orderBy: [{ location: "asc" }, { tableNumber: "asc" }],
      include: { _count: { select: { orders: true } } },
    }),
  ]);

  const serializedTables = tables.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <AdminDashboard
      initialMenus={menus}
      initialTables={serializedTables}
      defaultBaseUrl={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
    />
  );
}
