import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// "/" — лендинг (неавторизованным) либо редирект в /calculators (авторизованным).
// "/calculators" — калькуляторы, открыты всем без регистрации.
// Всё остальное (/documents, /accounting и т.д.) — только для авторизованных.
const PUBLIC_PATHS = ["/login", "/register", "/calculators"];
// Страницы, с которых авторизованного пользователя сразу уводят в его рабочее пространство.
const REDIRECT_IF_AUTHED_PATHS = ["/login", "/register", "/"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const isPublicPath = pathname === "/" || PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && REDIRECT_IF_AUTHED_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/calculators", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/invoice|api/report|api/accounting/analyze|api/documents/generate|api/documents/avr-pdf|api/documents/poa-pdf|api/documents/waybill-pdf|_next/static|_next/image|favicon.ico|logo.png|hero-woman.png|landing|fonts).*)",
  ],
};
