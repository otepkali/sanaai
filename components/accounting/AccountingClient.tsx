"use client";

import { useRef, useState, type DragEvent } from "react";
import { AlertTriangle, FileText, Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUser } from "@/lib/hooks/useUser";
import { saveAccountingAnalysis } from "@/lib/supabase/accounting-history";
import { DOCUMENT_TYPE_OPTIONS, type AccountingAnalysisResult, type DocumentType } from "@/lib/accounting/types";
import { cn } from "@/lib/utils";
import { ResultsView } from "./ResultsView";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".pdf"];

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex === -1 ? "" : filename.slice(dotIndex).toLowerCase();
}

export function AccountingClient() {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [period, setPeriod] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType | "">("");
  const [isDragging, setIsDragging] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [result, setResult] = useState<AccountingAnalysisResult | null>(null);

  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function validateFile(candidate: File): string | null {
    const extension = getExtension(candidate.name);
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return "Поддерживаются только файлы .xlsx, .xls, .csv, .pdf";
    }
    if (candidate.size > MAX_FILE_SIZE) {
      return "Файл слишком большой — максимум 10MB";
    }
    return null;
  }

  function handleFileSelected(candidate: File) {
    const validationError = validateFile(candidate);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    setFile(candidate);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) handleFileSelected(dropped);
  }

  async function handleAnalyze() {
    if (!file) {
      setFormError("Выберите файл для анализа");
      return;
    }
    if (!period.trim()) {
      setFormError("Укажите название периода");
      return;
    }
    if (!documentType) {
      setFormError("Выберите тип документа");
      return;
    }

    setFormError(null);
    setAnalyzeError(null);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("period", period.trim());
      formData.append("documentType", documentType);

      const response = await fetch("/api/accounting/analyze", { method: "POST", body: formData });
      const json = await response.json();

      if (!response.ok) {
        setAnalyzeError(typeof json.error === "string" ? json.error : "Не удалось выполнить анализ документа");
        return;
      }

      setResult(json as AccountingAnalysisResult);
    } catch {
      setAnalyzeError("Не удалось связаться с сервером. Попробуйте ещё раз.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleReset() {
    setFile(null);
    setPeriod("");
    setDocumentType("");
    setFormError(null);
    setAnalyzeError(null);
    setResult(null);
    setExpandedCategory(null);
    setSaveMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSaveToHistory() {
    if (!result || !user) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await saveAccountingAnalysis({ userId: user.id, result });
      setSaveMessage("Сохранено в историю");
    } catch {
      setSaveMessage("Не удалось сохранить в историю");
    } finally {
      setIsSaving(false);
    }
  }

  if (result) {
    return (
      <ResultsView
        result={result}
        expandedCategory={expandedCategory}
        onToggleCategory={(index) => setExpandedCategory((prev) => (prev === index ? null : index))}
        onReset={handleReset}
        onSave={handleSaveToHistory}
        isSaving={isSaving}
        saveMessage={saveMessage}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle>Загрузка документа</CardTitle>
          <CardDescription>
            Excel-выгрузка из 1С, банковская выписка, CSV или PDF — ИИ распределит операции по
            статьям движения денежных средств и плану счетов РК
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary-bg"
                : "border-border bg-surface-tint/40 hover:bg-surface-tint"
            )}
          >
            {file ? (
              <>
                <FileText className="h-8 w-8 text-primary" />
                <p className="font-medium text-text">{file.name}</p>
                <p className="text-xs text-text-muted">
                  {(file.size / 1024).toFixed(0)} КБ — нажмите, чтобы заменить
                </p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-text-muted" />
                <p className="font-medium text-text">Перетащите файл сюда или нажмите для выбора</p>
                <p className="text-xs text-text-muted">.xlsx, .xls, .csv, .pdf — до 10MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.pdf"
              className="hidden"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) handleFileSelected(selected);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Название периода</Label>
            <Input
              id="period"
              placeholder="Например: Май 2026"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentType">Тип документа</Label>
            <Select
              value={documentType}
              onValueChange={(value) => setDocumentType(value as DocumentType)}
            >
              <SelectTrigger id="documentType">
                <SelectValue placeholder="Выберите тип документа" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formError ? <p className="text-sm text-danger">{formError}</p> : null}
          {analyzeError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Ошибка анализа</AlertTitle>
              <AlertDescription>{analyzeError}</AlertDescription>
            </Alert>
          ) : null}

          <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full gap-2">
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isAnalyzing ? "Анализируем..." : "Анализировать"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
