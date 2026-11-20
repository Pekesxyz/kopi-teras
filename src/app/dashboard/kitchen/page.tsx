import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";
import { orderInclude, toOrderDTO } from "@/lib/orders";
import { KitchenDashboard } from "./kitchen-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Layar Dapur (KDS)" };

export default async function KitchenPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "KITCHEN") {
    redirect(ROLE_HOME[session.role]);
  }

  const orders = await prisma.order.findMany({
    where: { status: { in: ["PROCESSING", "READY"] } },
    include: orderInclude,
    orderBy: { createdAt: "asc" },
  });

  return <KitchenDashboard initialOrders={orders.map(toOrderDTO)} />;
}
