import { createElement, type ReactElement } from "react";
import { NextResponse } from "next/server";
import { z } from "zod";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { ReportDocument } from "@/lib/reports/ReportDocument";
import type { ReportData } from "@/lib/reports/types";

const reportRowSchema = z.object({
  label: z.string().min(1),
  value: z.string(),
  bold: z.boolean().optional(),
});

const reportTableColumnSchema = z.object({
  label: z.string().min(1),
  flex: z.number().positive().optional(),
  align: z.enum(["left", "right"]).optional(),
});

const reportTableSchema = z.object({
  columns: z.array(reportTableColumnSchema).min(1),
  rows: z.array(z.array(z.string())),
  boldRowIndexes: z.array(z.number().int().min(0)).optional(),
});

const reportDataSchema = z
  .object({
    type: z.enum(["fot", "simplified", "vat", "comparison"]),
    title: z.string().min(1, "Укажите название расчёта"),
    date: z.string().min(1, "Укажите дату"),
    inputs: z.array(reportRowSchema),
    rows: z.array(reportRowSchema),
    table: reportTableSchema.optional(),
    orientation: z.enum(["portrait", "landscape"]).optional(),
  })
  .refine((data) => data.rows.length > 0 || (data.table?.rows.length ?? 0) > 0, {
    message: "Нет данных результата для отчёта",
    path: ["rows"],
  });

/** renderToBuffer типизирован строго на элемент <Document> — то же ограничение типов, что в /api/invoice */
function asDocumentElement(data: ReportData): ReactElement<DocumentProps> {
  return createElement(ReportDocument, { data }) as unknown as ReactElement<DocumentProps>;
}

function buildFilename(type: string): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `sanaai_${type}_${dd}${mm}${yyyy}.pdf`;
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const parsed = reportDataSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 });
  }

  const data: ReportData = parsed.data;

  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(asDocumentElement(data));
  } catch (error) {
    console.error("Не удалось сформировать PDF отчёта", error);
    return NextResponse.json({ error: "Не удалось сформировать PDF" }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${buildFilename(data.type)}"`,
    },
  });
}
