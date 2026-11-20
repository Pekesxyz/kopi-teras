import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getActiveTable, INACTIVE_TABLE_MESSAGE } from "@/lib/tables";
import { InvalidTable } from "@/components/customer/invalid-table";
import { MenuCatalog } from "./menu-catalog";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ tableId: string }> };

export const metadata: Metadata = { title: "Menu" };

export default async function OrderMenuPage({ params }: Props) {
  const { tableId } = await params;
  const { table, reason } = await getActiveTable(tableId);

  if (!table) {
    return reason === "inactive" ? <InvalidTable {...INACTIVE_TABLE_MESSAGE} /> : <InvalidTable />;
  }

  const menus = await prisma.menu.findMany({
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
  });

  return <MenuCatalog table={table} initialMenus={menus} />;
}
