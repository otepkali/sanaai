import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseUploadedFile, FileParseError } from "@/lib/accounting/parse-file";
import { analyzeAccountingDocument, AccountingAnalysisError } from "@/lib/accounting/analyze";
import { DOCUMENT_TYPE_OPTIONS, type DocumentType } from "@/lib/accounting/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".pdf"];

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex === -1 ? "" : filename.slice(dotIndex).toLowerCase();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const file = formData.get("file");
  const period = formData.get("period");
  const documentType = formData.get("documentType");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }
  if (typeof period !== "string" || !period.trim()) {
    return NextResponse.json({ error: "Укажите название периода" }, { status: 400 });
  }
  if (typeof documentType !== "string") {
    return NextResponse.json({ error: "Укажите тип документа" }, { status: 400 });
  }

  const documentTypeOption = DOCUMENT_TYPE_OPTIONS.find(
    (option) => option.value === (documentType as DocumentType)
  );
  if (!documentTypeOption) {
    return NextResponse.json({ error: "Неизвестный тип документа" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Файл слишком большой — максимум 10MB" }, { status: 400 });
  }

  const extension = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return NextResponse.json(
      { error: "Поддерживаются только файлы .xlsx, .xls, .csv, .pdf" },
      { status: 400 }
    );
  }

  let extractedText: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    extractedText = await parseUploadedFile(buffer, extension);
  } catch (error) {
    const message = error instanceof FileParseError ? error.message : "Не удалось прочитать файл";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const result = await analyzeAccountingDocument({
      period: period.trim(),
      documentTypeLabel: documentTypeOption.label,
      extractedText,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof AccountingAnalysisError ? error.message : "Не удалось выполнить анализ документа";
    console.error("Ошибка анализа бухгалтерского документа", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
