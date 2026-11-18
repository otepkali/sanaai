import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) notFound();

  // Проверка прав в базе (таблица admins). Не-админ получает 404 — не раскрываем, что страница есть.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) notFound();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader userEmail={data.user.email ?? ""}>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-text sm:text-4xl">Админка</h1>
        <p className="mt-3 max-w-xl text-text-muted">
          Все пользователи, их подписки и активность. Ручное продление и закрытие доступа.
        </p>
      </AppHeader>

      <main className="container flex-1 py-8">
        <AdminUsersClient />
      </main>

      <AppFooter />
    </div>
  );
}
