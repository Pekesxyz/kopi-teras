import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";
import { orderInclude, toOrderDTO } from "@/lib/orders";
import { CashierDashboard } from "./cashier-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard Kasir" };

export default async function CashierPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CASHIER") {
    redirect(ROLE_HOME[session.role]);
  }

  const orders = await prisma.order.findMany({
    include: orderInclude,
    orderBy: { createdAt: "asc" },
    take: 150,
  });

  return <CashierDashboard initialOrders={orders.map(toOrderDTO)} />;
}
