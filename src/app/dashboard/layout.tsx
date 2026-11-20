import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <DashboardNav session={session} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
