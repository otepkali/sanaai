"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getCompanyFileSignedUrl } from "@/lib/supabase/requisites";

export function FileSlot({
  label,
  path,
  onUpload,
  isUploading,
  error,
}: {
  label: string;
  path: string | null;
  onUpload: (file: File) => void;
  isUploading: boolean;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      Promise.resolve().then(() => {
        setPreviewUrl(null);
        setPreviewError(null);
      });
      return;
    }
    getCompanyFileSignedUrl(path).then((url) => {
      setPreviewUrl(url);
      setPreviewError(url ? null : "Не удалось получить ссылку на загруженный файл");
    });
  }, [path]);

  return (
    <div className="space-y-2">
      <Label className="text-sm text-text-muted">{label}</Label>
      <div className="flex items-center gap-4 rounded-xl border border-border p-3">
        <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded-lg bg-surface-tint">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- предпросмотр PNG из приватного Storage по подписанной ссылке
            <img src={previewUrl} alt={label} className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-text-muted">Нет файла</span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Загрузить PNG
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {!error && previewError ? <p className="text-xs text-danger">{previewError}</p> : null}
    </div>
  );
}
