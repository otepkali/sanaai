import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/UserMenu";
import { Dashboard } from "@/components/Dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userEmail = data.user?.email ?? "";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-gradient-to-b from-white to-surface-tint">
        <div className="container flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Sana Ai" width={160} height={60} className="h-9 w-auto" priority />
            <span className="hidden border-l border-border pl-3 text-sm text-text-muted sm:block">
              Налоговый калькулятор РК
            </span>
          </div>
          <div className="flex items-center gap-3">
            {userEmail ? <UserMenu email={userEmail} /> : null}
            <ThemeToggle />
          </div>
        </div>
        <div className="container pb-12 pt-4">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Налоги Казахстана 2026 — быстро, точно, с разбивкой каждой суммы
          </h1>
          <p className="mt-3 max-w-xl text-text-muted">
            ФОТ, упрощённая декларация (910), НДС и сравнение режимов — в одном инструменте
            для бухгалтеров и владельцев ИП.
          </p>
        </div>
      </header>

      <Dashboard />

      <footer className="border-t border-border bg-surface-tint/60">
        <div className="container py-6 text-xs leading-relaxed text-text-muted">
          Калькулятор носит справочный характер. Ставки актуальны на 2026 год. Для официальных
          расчётов сверяйтесь с Налоговым кодексом РК и консультируйтесь с бухгалтером.
        </div>
      </footer>
    </div>
  );
}
