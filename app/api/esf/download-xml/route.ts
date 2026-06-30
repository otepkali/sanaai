import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { esfDataSchema } from "@/lib/esf/schemas";
import { generateEsfXml } from "@/lib/esf/generate-xml";

/**
 * HTTP-заголовки допускают только Latin-1 — номер ЭСФ обычно содержит кириллицу
 * ("ЭСФ-2026-001"), поэтому даём ASCII-фолбэк в filename и настоящее имя через
 * RFC 5987 filename* (его браузеры используют для реального сохранённого имени).
 */
function buildContentDisposition(rawFilename: string): string {
  const asciiFallback = rawFilename.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(rawFilename);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const parsed = esfDataSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте заполненные поля" }, { status: 400 });
  }

  const xml = generateEsfXml(parsed.data);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": buildContentDisposition(`esf-${parsed.data.sectionA.accountingSystemNumber || "1"}.xml`),
    },
  });
}
