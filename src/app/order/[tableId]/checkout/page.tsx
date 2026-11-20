import type { Metadata } from "next";
import { getActiveTable, INACTIVE_TABLE_MESSAGE } from "@/lib/tables";
import { InvalidTable } from "@/components/customer/invalid-table";
import { CheckoutForm } from "./checkout-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Checkout" };

type Props = { params: Promise<{ tableId: string }> };

export default async function CheckoutPage({ params }: Props) {
  const { tableId } = await params;
  const { table, reason } = await getActiveTable(tableId);

  if (!table) {
    return reason === "inactive" ? <InvalidTable {...INACTIVE_TABLE_MESSAGE} /> : <InvalidTable />;
  }

  return (
    <CheckoutForm
      table={table}
      qrisImage={process.env.NEXT_PUBLIC_QRIS_IMAGE || "/qrcodes/qris-kopi-teras.svg"}
    />
  );
}
