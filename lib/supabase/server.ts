import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Supabase-клиент для Server Components и Route Handlers (Next 16: cookies() асинхронный) */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Вызвано из Server Component — сессию обновляет proxy.ts,
            // здесь запись cookie недоступна и это безопасно игнорировать.
          }
        },
      },
    }
  );
}
