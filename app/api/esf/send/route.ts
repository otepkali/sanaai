import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import { createClient } from "@/lib/supabase/server";
import { esfDataSchema } from "@/lib/esf/schemas";

const ESF_PROD_URL = "https://esf.gov.kz:8443/esf-web/rest/api/invoice/send";
const ESF_TEST_URL = "https://test1.esf.kgd.gov.kz:8443/esf-web/rest/api/invoice/send";

interface EsfSendRequestBody {
  signedXml: string;
  esfData: unknown;
  testMode?: boolean;
}

async function describeError(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.message === "string") return parsed.message;
    if (typeof parsed?.error === "string") return parsed.error;
  } catch {
    // не JSON — пробуем разобрать как XML (часто SOAP-fault от шлюза ИС ЭСФ)
    try {
      const xml = await parseStringPromise(text);
      const fault = JSON.stringify(xml).slice(0, 500);
      return `ИС ЭСФ вернула ошибку: ${fault}`;
    } catch {
      // не XML — отдаём как есть
    }
  }
  return text.slice(0, 500) || `ИС ЭСФ вернула код ${response.status}`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  let body: EsfSendRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Некорректный JSON" }, { status: 400 });
  }

  if (!body.signedXml || typeof body.signedXml !== "string") {
    return NextResponse.json({ success: false, error: "Отсутствует подписанный XML" }, { status: 400 });
  }

  const parsedEsfData = esfDataSchema.safeParse(body.esfData);
  if (!parsedEsfData.success) {
    return NextResponse.json({ success: false, error: "Проверьте заполненные поля документа" }, { status: 400 });
  }
  const esfData = parsedEsfData.data;

  const targetUrl = body.testMode ? ESF_TEST_URL : ESF_PROD_URL;

  const baseRow = {
    user_id: user.id,
    document_number: esfData.sectionA.accountingSystemNumber,
    document_date: esfData.sectionA.issueDate,
    buyer_bin: esfData.sectionC.binIin,
    buyer_name: esfData.sectionC.name,
    total_sum: esfData.totalSum,
    total_nds: esfData.totalVat,
    total_with_nds: esfData.totalSumWithTax,
    items: esfData.items,
    data: esfData,
    signed_xml: body.signedXml,
  };

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        Accept: "application/json",
      },
      body: body.signedXml,
    });

    if (!response.ok) {
      const errorMessage = await describeError(response);
      await supabase.from("esf_documents").insert({
        ...baseRow,
        status: "error",
        error_message: errorMessage,
      });
      return NextResponse.json({ success: false, error: errorMessage }, { status: 502 });
    }

    let invoiceId: string | null = null;
    try {
      const result = await response.json();
      invoiceId = result?.invoiceId ?? result?.id ?? null;
    } catch {
      invoiceId = null;
    }

    await supabase.from("esf_documents").insert({
      ...baseRow,
      status: "sent",
      esf_id: invoiceId,
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, invoiceId });
  } catch (error) {
    const description = error instanceof Error ? error.message : "неизвестная ошибка сети";
    await supabase.from("esf_documents").insert({
      ...baseRow,
      status: "error",
      error_message: `Не удалось связаться с ИС ЭСФ: ${description}`,
    });
    return NextResponse.json(
      { success: false, error: `Не удалось связаться с ИС ЭСФ: ${description}` },
      { status: 502 }
    );
  }
}
