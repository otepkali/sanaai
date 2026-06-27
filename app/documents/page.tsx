import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { DocumentsClient } from "@/components/documents/DocumentsClient";
import { createClient } from "@/lib/supabase/server";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userEmail = data.user?.email ?? "";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader userEmail={userEmail}>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          Документы
        </h1>
        <p className="mt-3 max-w-xl text-text-muted">
          Счета на оплату, акты выполненных работ, доверенности, накладные и расчётные ведомости —
          по официальным формам РК, с автоматической подстановкой реквизитов компании.
        </p>
      </AppHeader>

      <main className="container flex-1 py-8">
        <DocumentsClient />
      </main>

      <AppFooter />
    </div>
  );
}
