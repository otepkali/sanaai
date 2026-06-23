"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportData } from "@/lib/reports/types";

export function DownloadPdfButton({ data }: { data: ReportData }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setError(null);
    setIsDownloading(true);
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        setError("Не удалось сформировать PDF.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? `sanaai_${data.type}.pdf`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Не удалось связаться с сервером. Попробуйте ещё раз.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={handleDownload}
        disabled={isDownloading}
        className="gap-2"
      >
        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Скачать PDF
      </Button>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
