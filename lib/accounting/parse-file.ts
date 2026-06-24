import * as XLSX from "xlsx";

const MAX_EXTRACTED_CHARS = 60_000;

export class FileParseError extends Error {}

function truncate(text: string): string {
  if (text.length <= MAX_EXTRACTED_CHARS) return text;
  return `${text.slice(0, MAX_EXTRACTED_CHARS)}\n\n[... содержимое обрезано, документ слишком большой ...]`;
}

function parseExcel(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  if (workbook.SheetNames.length === 0) {
    throw new FileParseError("В файле не найдено листов с данными");
  }

  const parts = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return `Лист "${sheetName}":\n${csv}`;
  });

  return parts.join("\n\n");
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.replace(/--\s*\d+\s*of\s*\d+\s*--/g, "").trim();
  } finally {
    await parser.destroy();
  }
}

/** Извлекает текстовое содержимое загруженного файла для передачи в ИИ. */
export async function parseUploadedFile(buffer: Buffer, extension: string): Promise<string> {
  let text: string;

  try {
    if (extension === ".xlsx" || extension === ".xls") {
      text = parseExcel(buffer);
    } else if (extension === ".csv") {
      text = buffer.toString("utf-8");
    } else if (extension === ".pdf") {
      text = await parsePdf(buffer);
    } else {
      throw new FileParseError(`Неподдерживаемый формат файла: ${extension}`);
    }
  } catch (error) {
    if (error instanceof FileParseError) throw error;
    console.error("Ошибка чтения файла", extension, error);
    throw new FileParseError("Не удалось прочитать содержимое файла. Проверьте, что файл не повреждён.");
  }

  if (!text.trim()) {
    throw new FileParseError("Файл не содержит читаемого текста или таблиц");
  }

  return truncate(text);
}
