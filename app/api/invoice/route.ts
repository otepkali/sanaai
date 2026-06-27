import { createElement, type ReactElement } from "react";
import { NextResponse } from "next/server";
import { z } from "zod";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/lib/invoice/InvoiceDocument";
import { ensureFontWarmedUp } from "@/lib/pdf-fonts";
import type { InvoiceData } from "@/lib/invoice/types";

/** renderToBuffer типизирован строго на элемент <Document>, хотя на практике принимает
 *  любой компонент, который его рендерит — это известное ограничение типов @react-pdf/renderer. */
function asDocumentElement(data: InvoiceData): ReactElement<DocumentProps> {
  return createElement(InvoiceDocument, { data }) as unknown as ReactElement<DocumentProps>;
}

const invoicePartySchema = z.object({
  binIin: z.string().min(1, "Укажите БИН/ИИН"),
  name: z.string().min(1, "Укажите наименование"),
  address: z.string().optional(),
});

const invoiceItemSchema = z.object({
  code: z.string(),
  name: z.string().min(1, "Укажите наименование товара"),
  qty: z.number().min(0, "Не может быть отрицательным"),
  unit: z.string(),
  price: z.number().min(0, "Не может быть отрицательной"),
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
  number: z.string().min(1, "Укажите номер счёта"),
  date: z.string().min(1, "Укажите дату"),
  beneficiary: invoiceBeneficiarySchema,
  supplier: invoicePartySchema,
  buyer: invoicePartySchema,
  contract: z.string(),
  items: z.array(invoiceItemSchema).min(1, "Добавьте хотя бы одну позицию"),
  isVatPayer: z.boolean(),
  vatMode: z.enum(["inclusive", "exclusive"]),
  showTaxBlock: z.boolean(),
  taxableIncome: z.number().min(0).optional(),
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
    return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 });
  }

  // Суммы пересчитываются на сервере внутри InvoiceDocument (lib/invoice/calc.ts) —
  // клиент передаёт только qty/price по позициям, никаких итогов с фронтенда.
  const data: InvoiceData = parsed.data;

  let buffer: Buffer;
  try {
    await ensureFontWarmedUp();
    buffer = await renderToBuffer(asDocumentElement(data));
  } catch (error) {
    console.error("Не удалось сформировать PDF счёта", error);
    return NextResponse.json({ error: "Не удалось сформировать PDF" }, { status: 500 });
  }

  const safeNumber = data.number.replace(/[^a-zA-Z0-9_-]/g, "_") || "invoice";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="schet-${safeNumber}.pdf"`,
    },
  });
}
