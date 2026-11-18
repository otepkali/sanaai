import type { DocumentType } from "./types";

/** Куда отправлять данные документа для генерации PDF и в каком виде */
const PDF_ENDPOINTS: Record<DocumentType, { url: string; wrap: (data: unknown) => unknown }> = {
  invoice: { url: "/api/invoice", wrap: (data) => data },
  avr: { url: "/api/documents/avr-pdf", wrap: (data) => data },
  poa: { url: "/api/documents/poa-pdf", wrap: (data) => data },
  waybill: { url: "/api/documents/waybill-pdf", wrap: (data) => data },
  payroll: { url: "/api/documents/generate", wrap: (data) => ({ type: "payroll", data }) },
};

/**
 * Генерирует PDF по сохранённым данным документа и скачивает его.
 * Бросает Error с понятным текстом, если сервер не смог сформировать файл.
 */
export async function downloadDocumentPdf(
  type: DocumentType,
  data: unknown,
  filename: string
): Promise<void> {
  const endpoint = PDF_ENDPOINTS[type];
  const response = await fetch(endpoint.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(endpoint.wrap(data)),
  });

  if (!response.ok) {
    const errorBody: { error?: unknown } | null = await response.json().catch(() => null);
    const detail = typeof errorBody?.error === "string" ? errorBody.error : null;
    throw new Error(detail ? `Не удалось сформировать документ: ${detail}` : "Не удалось сформировать документ.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
