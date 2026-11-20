"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FetchError, sendJson } from "@/lib/fetcher";

export function LoginForm({ nextUrl }: { nextUrl?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || loading) return;

    setLoading(true);
    try {
      const res = await sendJson<{ redirectTo: string }>("/api/auth/login", "POST", {
        username: username.trim(),
        password,
      });
      toast.success("Login berhasil!");
      router.replace(nextUrl || res.redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof FetchError ? error.message : "Gagal terhubung ke server. Coba lagi.",
      );
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Portal Staf Kopi Teras</CardTitle>
        <CardDescription>
          Masuk untuk mengakses Dashboard Kasir, Dapur (KDS), atau Admin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <LogIn />}
            {loading ? "Memverifikasi…" : "Masuk"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
