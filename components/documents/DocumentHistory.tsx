"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUser } from "@/lib/hooks/useUser";
import { deleteDocument, listDocuments, type DocumentRow } from "@/lib/supabase/documents";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documents/types";
import { downloadDocumentPdf } from "@/lib/documents/pdf";

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface DocumentHistoryProps {
  /** Меняется после каждого сохранения документа — сигнал перечитать список */
  refreshSignal: number;
}

export function DocumentHistory({ refreshSignal }: DocumentHistoryProps) {
  const { user } = useUser();
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!user) return;
    setIsLoading(true);
    listDocuments(user.id)
      .then(setRows)
      .catch((err) => console.error("Не удалось загрузить историю документов", err))
      .finally(() => setIsLoading(false));
  }, [user]);

  useEffect(() => {
    // Отложено на микрозадачу — тот же приём, что в HistorySidebar/useUser.
    Promise.resolve().then(() => reload());
  }, [reload, refreshSignal]);

  async function handleDownload(row: DocumentRow) {
    setError(null);
    setDownloadingId(row.id);
    try {
      await downloadDocumentPdf(row.type, row.data, `${row.type}-${row.id.slice(0, 8)}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось скачать документ.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDocument(id);
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error("Не удалось удалить документ", err);
    }
  }

  if (!user) return null;

  return (
    <Card className="mt-8 rounded-2xl border-border shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg">История документов</CardTitle>
        <CardDescription>Каждый скачанный документ сохраняется сюда автоматически.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? <p className="mb-3 text-xs text-danger">{error}</p> : null}
        {isLoading && rows.length === 0 ? (
          <div className="flex justify-center py-6 text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-text-muted">Пока пусто — скачайте любой документ, и он появится здесь.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {row.title ?? DOCUMENT_TYPE_LABELS[row.type] ?? row.type}
                  </p>
                  <p className="text-xs text-text-muted">
                    {DOCUMENT_TYPE_LABELS[row.type] ?? row.type} · {formatCreatedAt(row.created_at)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleDownload(row)}
                  disabled={downloadingId === row.id || !(row.type in DOCUMENT_TYPE_LABELS)}
                >
                  {downloadingId === row.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  PDF
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-text-muted hover:text-danger"
                      aria-label="Удалить документ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить документ из истории?</AlertDialogTitle>
                      <AlertDialogDescription>
                        «{row.title}» будет удалён без возможности восстановления.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(row.id)}>Удалить</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
