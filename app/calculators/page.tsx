import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Dashboard } from "@/components/Dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function CalculatorsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userEmail = data.user?.email ?? "";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader userEmail={userEmail}>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          Налоги Казахстана 2026 — быстро, точно, с разбивкой каждой суммы
        </h1>
        <p className="mt-3 max-w-xl text-text-muted">
          ФОТ, упрощённая декларация (910), НДС и сравнение режимов — в одном инструменте
          для бухгалтеров и владельцев ИП.
        </p>
      </AppHeader>

      <Dashboard />

      <AppFooter />
    </div>
  );
}
