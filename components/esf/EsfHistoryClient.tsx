"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTenge } from "@/lib/format";
import { listEsfDocuments, deleteEsfDocument, type EsfDocumentRow, type EsfDocumentStatus } from "@/lib/supabase/esf";

const STATUS_LABELS: Record<EsfDocumentStatus, { label: string; className: string }> = {
  draft: { label: "Черновик", className: "bg-surface-tint text-text-muted" },
  signed: { label: "Подписан", className: "bg-primary-bg text-primary" },
  sent: { label: "Отправлен в ИС ЭСФ", className: "bg-success/10 text-success" },
  error: { label: "Ошибка", className: "bg-danger/10 text-danger" },
};

export function EsfHistoryClient() {
  const [documents, setDocuments] = useState<EsfDocumentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listEsfDocuments()
      .then(setDocuments)
      .catch((e) => setError(e instanceof Error ? e.message : "Не удалось загрузить историю"))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleDelete(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    await deleteEsfDocument(id);
  }

  function downloadXml(doc: EsfDocumentRow) {
    const xml = doc.signed_xml || doc.xml_content;
    if (!xml) return;
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `esf-${doc.document_number}.xml`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12 text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  if (documents.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">Пока нет ни одного ЭСФ</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-soft">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>№</TableHead>
            <TableHead>Покупатель</TableHead>
            <TableHead className="text-right">Сумма</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => {
            const status = STATUS_LABELS[doc.status];
            return (
              <TableRow key={doc.id}>
                <TableCell className="font-medium text-text">{doc.document_number}</TableCell>
                <TableCell>{doc.buyer_name || "—"}</TableCell>
                <TableCell className="text-right font-tabular">
                  {doc.total_with_nds != null ? formatTenge(doc.total_with_nds) : "—"}
                </TableCell>
                <TableCell>{doc.document_date}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                  {doc.status === "error" && doc.error_message ? (
                    <p className="mt-1 max-w-xs text-xs text-danger">{doc.error_message}</p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => downloadXml(doc)} disabled={!doc.xml_content && !doc.signed_xml}>
                      XML
                    </Button>
                    {doc.status === "error" ? (
                      <Button variant="ghost" size="sm" className="gap-1" disabled title="Повторите отправку со страницы выписки ЭСФ">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="text-text-muted transition-colors hover:text-danger"
                      aria-label="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
