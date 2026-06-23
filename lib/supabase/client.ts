import { createBrowserClient } from "@supabase/ssr";

/** Supabase-клиент для клиентских компонентов — хранит сессию в cookie, синхронизируется с сервером */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
