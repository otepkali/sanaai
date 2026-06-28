import { NextResponse } from "next/server";
import { z } from "zod";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { generateInvoiceHtml } from "@/lib/invoice/invoice-template";
import type { InvoiceData } from "@/lib/invoice/types";

// Холодный старт Chromium + рендер страницы дольше обычного серверлес-роута.
export const maxDuration = 30;

const invoicePartySchema = z.object({
  binIin: z.string(),
  name: z.string(),
  address: z.string().optional(),
});

const invoiceItemSchema = z.object({
  code: z.string(),
  name: z.string(),
  qty: z.number(),
  unit: z.string(),
  price: z.number(),
});

const invoiceBeneficiarySchema = z.object({
  name: z.string(),
  iin: z.string(),
  iik: z.string(),
  kbe: z.string(),
  bankName: z.string(),
  bik: z.string(),
  knp: z.string(),
});

const invoiceDataSchema = z.object({
  number: z.string(),
  date: z.string(),
  beneficiary: invoiceBeneficiarySchema,
  supplier: invoicePartySchema,
  buyer: invoicePartySchema,
  contract: z.string(),
  items: z.array(invoiceItemSchema),
  isVatPayer: z.boolean(),
  vatMode: z.enum(["inclusive", "exclusive"]),
  showTaxBlock: z.boolean(),
  taxableIncome: z.number().optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const parsed = invoiceDataSchema.safeParse(json);
  if (!parsed.success) {
    console.error("Не прошла валидация данных счёта", z.treeifyError(parsed.error));
    return NextResponse.json({ error: "Проверьте заполненные поля" }, { status: 400 });
  }

  // Суммы пересчитываются на сервере внутри generateInvoiceHtml (lib/invoice/calc.ts) —
  // клиент передаёт только qty/price по позициям, никаких итогов с фронтенда.
  const data: InvoiceData = parsed.data;
  const html = generateInvoiceHtml(data);

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
    console.error("Не удалось сформировать PDF счёта", error);
    return NextResponse.json({ error: "Не удалось сформировать PDF" }, { status: 500 });
  }

  const safeNumber = data.number.replace(/[^a-zA-Z0-9_-]/g, "_") || "invoice";

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="schet-${safeNumber}.pdf"`,
    },
  });
}
