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

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(signUpError.message || "Не удалось зарегистрироваться.");
      setIsSubmitting(false);
      return;
    }

    if (!data.session) {
      // Подтверждение email включено в проекте Supabase — сессии пока нет.
      setConfirmationSent(true);
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
          <CardTitle>Регистрация</CardTitle>
          <CardDescription>Налоговый калькулятор Казахстана 2026</CardDescription>
        </CardHeader>
        <CardContent>
          {confirmationSent ? (
            <p className="rounded-xl bg-primary-bg p-4 text-center text-sm text-text">
              Проверьте почту <span className="font-medium">{email}</span> — мы отправили
              письмо для подтверждения регистрации.
            </p>
          ) : (
            <>
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
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Зарегистрироваться
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-text-muted">
                Уже есть аккаунт?{" "}
                <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
                  Войти
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
