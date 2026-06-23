"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Неверный email или пароль.");
      setIsSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-gradient-to-b from-white to-surface-tint px-4 py-12">
      <Card className="w-full max-w-sm rounded-2xl border-border shadow-soft">
        <CardHeader className="items-center text-center">
          <Image src="/logo.png" alt="Sana Ai" width={160} height={60} className="mb-2 h-10 w-auto" />
          <CardTitle>Вход</CardTitle>
          <CardDescription>Налоговый калькулятор Казахстана 2026</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-text-muted">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm text-text-muted">
                Пароль
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Войти
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-text-muted">
            Нет аккаунта?{" "}
            <Link href="/register" className="font-medium text-primary hover:text-primary-hover">
              Зарегистрироваться
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
