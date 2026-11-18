import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Сюда ведёт ссылка из письма Supabase (подтверждение почты при регистрации).
 * Обменивает одноразовый код из ссылки на сессию — пользователь сразу оказывается
 * залогинен — и уводит на главную. При ошибке — на /login с пояснением.
 *
 * Поддерживает оба формата ссылок Supabase:
 *  - ?code=...                 (PKCE, стандартное письмо при @supabase/ssr)
 *  - ?token_hash=...&type=...  (если шаблон письма настроен на token_hash)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  if (ok) {
    return NextResponse.redirect(new URL("/", origin));
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "confirm");
  return NextResponse.redirect(loginUrl);
}
