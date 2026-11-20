"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL } from "@/lib/constants";
import { sendJson } from "@/lib/fetcher";
import type { SessionPayload } from "@/lib/session";

export function DashboardNav({ session }: { session: SessionPayload }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await sendJson("/api/auth/logout", "POST");
      toast.success("Berhasil keluar.");
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Gagal keluar, silakan coba lagi.");
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#CFE8F3] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-[#CFE8F3]">|</span>
          <Badge variant="secondary" className="text-xs font-semibold">
            {ROLE_LABEL[session.role]}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm leading-tight font-semibold text-[#1B365D]">{session.name}</p>
            <p className="text-muted-foreground font-mono text-[11px]">@{session.username}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" />
            <span>Keluar</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
