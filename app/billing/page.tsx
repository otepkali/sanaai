import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { BillingClient } from "@/components/billing/BillingClient";
import { createClient } from "@/lib/supabase/server";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userEmail = data.user?.email ?? "";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader userEmail={userEmail}>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-text sm:text-4xl">Подписка</h1>
        <p className="mt-3 max-w-xl text-text-muted">
          Калькуляторы бесплатны всегда. Документы, история и реквизиты компании — по подписке.
        </p>
      </AppHeader>

      <main className="container flex-1 py-8">
        <BillingClient />
      </main>

      <AppFooter />
    </div>
  );
}
