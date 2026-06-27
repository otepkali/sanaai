import { createElement, type ReactElement } from "react";
import { NextResponse } from "next/server";
import { z } from "zod";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { ensureFontWarmedUp } from "@/lib/pdf-fonts";
import { getRequisitesServer, downloadCompanyFileServer } from "@/lib/supabase/requisites";
import { generateDocumentSchema } from "@/lib/documents/schemas";
import { EMPTY_REQUISITES } from "@/lib/documents/types";
import { AvrDocument } from "@/lib/documents/AvrDocument";
import { PoaDocument } from "@/lib/documents/PoaDocument";
import { WaybillDocument } from "@/lib/documents/WaybillDocument";
import { PayrollSheetDocument } from "@/lib/documents/PayrollSheetDocument";

function asDocumentElement(element: ReturnType<typeof createElement>): ReactElement<DocumentProps> {
  return element as unknown as ReactElement<DocumentProps>;
}

function buildFilename(type: string): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `sanaai_${type}_${dd}${mm}${yyyy}.pdf`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const parsed = generateDocumentSchema.safeParse(json);
  if (!parsed.success) {
    console.error("Не прошла валидация данных документа", z.treeifyError(parsed.error));
    return NextResponse.json({ error: "Проверьте заполненные поля", details: z.treeifyError(parsed.error) }, { status: 400 });
  }

  let requisites;
  try {
    requisites = (await getRequisitesServer(supabase)) ?? EMPTY_REQUISITES;
  } catch (error) {
    console.error("Не удалось получить реквизиты компании", error);
    return NextResponse.json({ error: "Не удалось получить реквизиты компании" }, { status: 500 });
  }

  const [signature, stamp] = await Promise.all([
    requisites.signaturePath ? downloadCompanyFileServer(supabase, requisites.signaturePath) : null,
    requisites.stampPath ? downloadCompanyFileServer(supabase, requisites.stampPath) : null,
  ]);

  let element: ReturnType<typeof createElement>;
  switch (parsed.data.type) {
    case "avr":
      element = createElement(AvrDocument, { data: parsed.data.data, requisites, signature, stamp });
      break;
    case "poa":
      element = createElement(PoaDocument, { data: parsed.data.data, requisites, signature, stamp });
      break;
    case "waybill":
      element = createElement(WaybillDocument, { data: parsed.data.data, requisites, signature, stamp });
      break;
    case "payroll":
      element = createElement(PayrollSheetDocument, { data: parsed.data.data, requisites });
      break;
  }

  let buffer: Buffer;
  try {
    await ensureFontWarmedUp();
    buffer = await renderToBuffer(asDocumentElement(element));
  } catch (error) {
    console.error("Не удалось сформировать PDF документа", error);
    return NextResponse.json({ error: "Не удалось сформировать PDF" }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${buildFilename(parsed.data.type)}"`,
    },
  });
}
