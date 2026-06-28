import { NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { createClient } from "@/lib/supabase/server";
import { getRequisitesServer, downloadCompanyFileServer } from "@/lib/supabase/requisites";
import { poaDataSchema } from "@/lib/documents/schemas";
import { EMPTY_REQUISITES } from "@/lib/documents/types";
import { generatePoaHtml } from "@/lib/documents/poa-template";

// Холодный старт Chromium + рендер страницы дольше обычного серверлес-роута.
export const maxDuration = 30;

function buildFilename(poaNumber: string): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `sanaai_poa_${poaNumber || "1"}_${dd}${mm}${yyyy}.pdf`;
}

function toBase64Image(buffer: Buffer | null): string | undefined {
  if (!buffer) return undefined;
  return `data:image/png;base64,${buffer.toString("base64")}`;
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

  const parsed = poaDataSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте заполненные поля" }, { status: 400 });
  }
  const data = parsed.data;

  let requisites;
  try {
    requisites = (await getRequisitesServer(supabase)) ?? EMPTY_REQUISITES;
  } catch (error) {
    console.error("Не удалось получить реквизиты компании", error);
    return NextResponse.json({ error: "Не удалось получить реквизиты компании" }, { status: 500 });
  }

  const [signatureBuffer, stampBuffer] = await Promise.all([
    requisites.signaturePath ? downloadCompanyFileServer(supabase, requisites.signaturePath) : null,
    requisites.stampPath ? downloadCompanyFileServer(supabase, requisites.stampPath) : null,
  ]);

  const html = generatePoaHtml({
    binIin: requisites.binIin,
    companyName: requisites.companyName,
    directorName: requisites.directorName,
    accountantName: requisites.accountantName,
    poaNumber: data.poaNumber,
    issueDate: data.issueDate,
    validUntilRecipient: data.validUntilRecipient,
    validUntilPayer: data.validUntilPayer,
    bankAccount: data.bankAccount,
    bankName: data.bankName,
    issuedToPosition: data.issuedToPosition,
    issuedToName: data.issuedToName,
    idDocumentSeries: data.idDocumentSeries,
    idDocumentNumber: data.idDocumentNumber,
    idDocumentDate: data.idDocumentDate,
    idDocumentIssuedBy: data.idDocumentIssuedBy,
    supplierName: data.supplierName,
    documentBasis: data.documentBasis,
    items: data.items,
    signatureImageBase64: toBase64Image(signatureBuffer),
    stampImageBase64: toBase64Image(stampBuffer),
  });

  let pdf: Buffer;
  try {
    const isVercel = Boolean(process.env.VERCEL);
    const executablePath = isVercel
      ? await chromium.executablePath()
      : process.env.LOCAL_CHROME_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

    const browser = await puppeteer.launch({
      args: isVercel ? chromium.args : [],
      executablePath,
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      const pdfArray = await page.pdf({
        format: "A4",
        landscape: false,
        printBackground: true,
        margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
      });
      pdf = Buffer.from(pdfArray);
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("Не удалось сформировать PDF документа (Puppeteer)", error);
    return NextResponse.json({ error: "Не удалось сформировать PDF" }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${buildFilename(data.poaNumber)}"`,
    },
  });
}
