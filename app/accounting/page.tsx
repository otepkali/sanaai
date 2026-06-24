import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { AccountingClient } from "@/components/accounting/AccountingClient";
import { createClient } from "@/lib/supabase/server";

export default async function AccountingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userEmail = data.user?.email ?? "";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader userEmail={userEmail}>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          Учёт и ведомости — автоматическая категоризация транзакций
        </h1>
        <p className="mt-3 max-w-xl text-text-muted">
          Загрузите банковскую выписку или выгрузку из 1С — ИИ распределит операции по статьям
          движения денежных средств и плану счетов РК.
        </p>
      </AppHeader>

      <main className="container flex-1 py-8">
        <AccountingClient />
      </main>

      <AppFooter />
    </div>
  );
}
