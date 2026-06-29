import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { RequisitesForm } from "@/components/documents/RequisitesForm";
import { createClient } from "@/lib/supabase/server";

export default async function RequisitesPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userEmail = data.user?.email ?? "";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader userEmail={userEmail}>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          Мои реквизиты
        </h1>
        <p className="mt-3 max-w-xl text-text-muted">
          Организация, адреса, счета, склады, кассы и подписанты — заполняются один раз и
          автоматически подставляются во все бухгалтерские документы.
        </p>
      </AppHeader>

      <main className="container flex-1 py-8">
        <RequisitesForm />
      </main>

      <AppFooter />
    </div>
  );
}
