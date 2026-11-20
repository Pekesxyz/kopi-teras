import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Login Staf" };

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/dashboard") ? next : undefined;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Logo />
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-[#1B365D]/30 bg-white font-semibold text-[#1B365D] hover:border-[#005A9C] hover:bg-[#E3F5FB]"
        >
          <Link href="/">
            <ArrowLeft className="size-3.5" /> Beranda
          </Link>
        </Button>
      </div>

      <LoginForm nextUrl={safeNext} />
    </main>
  );
}
