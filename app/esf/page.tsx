import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { EsfForm } from "@/components/esf/EsfForm";
import { createClient } from "@/lib/supabase/server";
import { getRequisitesServer } from "@/lib/supabase/requisites";
import { EMPTY_REQUISITES } from "@/lib/documents/types";

export default async function EsfPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userEmail = data.user?.email ?? "";
  const requisites = (await getRequisitesServer(supabase)) ?? EMPTY_REQUISITES;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader userEmail={userEmail}>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          Выписать ЭСФ
        </h1>
        <p className="mt-3 max-w-xl text-text-muted">
          Электронный счёт-фактура — скачайте XML для ручной загрузки на esf.gov.kz или подпишите
          и отправьте напрямую через NCALayer.
        </p>
      </AppHeader>

      <main className="container flex-1 py-8">
        <EsfForm requisites={requisites} />
      </main>

      <AppFooter />
    </div>
  );
}
