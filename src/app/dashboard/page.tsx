import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardIndexPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(ROLE_HOME[session.role]);
}
