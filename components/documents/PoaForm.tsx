"use client";

import { useId, useState } from "react";
import { Download, Loader2, Plus, Save, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser } from "@/lib/hooks/useUser";
import { saveDocument } from "@/lib/supabase/documents";
import type { PoaAssetItem, PoaData } from "@/lib/documents/types";

interface EditableItem extends PoaAssetItem {
  id: number;
}

let nextId = 1;
const createItem = (): EditableItem => ({ id: nextId++, name: "", unit: "шт.", quantityInWords: "" });

export function PoaForm() {
  const { user } = useUser();
  const [poaNumber, setPoaNumber] = useState("1");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [validUntilRecipient, setValidUntilRecipient] = useState("");
  const [validUntilPayer, setValidUntilPayer] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [issuedToPosition, setIssuedToPosition] = useState("");
  const [issuedToName, setIssuedToName] = useState("");
  const [idDocumentSeries, setIdDocumentSeries] = useState("");
  const [idDocumentNumber, setIdDocumentNumber] = useState("");
  const [idDocumentDate, setIdDocumentDate] = useState("");
  const [idDocumentIssuedBy, setIdDocumentIssuedBy] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [documentBasis, setDocumentBasis] = useState("");
  const [items, setItems] = useState<EditableItem[]>(() => [createItem()]);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateItem(id: number, patch: Partial<EditableItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }
  function addItem() {
    setItems((prev) => [...prev, createItem()]);
  }
  function removeItem(id: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  function buildData(): PoaData {
    return {
      poaNumber,
      issueDate,
      validUntilRecipient,
      validUntilPayer,
      bankAccount,
      bankName,
      issuedToPosition,
      issuedToName,
      idDocumentSeries,
      idDocumentNumber,
      idDocumentDate,
      idDocumentIssuedBy,
      supplierName,
      documentBasis,
      items: items.map(({ name, unit, quantityInWords }) => ({ name, unit, quantityInWords })),
    };
  }

  async function handleDownload() {
    setMessage(null);
    setIsDownloading(true);
    try {
      const response = await fetch("/api/documents/poa-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildData()),
      });
      if (!response.ok) {
        const errorBody: { error?: unknown } | null = await response.json().catch(() => null);
        const detail = typeof errorBody?.error === "string" ? errorBody.error : null;
        setMessage(detail ? `Не удалось сформировать документ: ${detail}` : "Не удалось сформировать документ.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `poa-${poaNumber || "1"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setMessage("Не удалось связаться с сервером. Попробуйте ещё раз.");
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleSaveToHistory() {
    if (!user) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await saveDocument({
        userId: user.id,
        type: "poa",
        title: `Доверенность № ${poaNumber || "—"} от ${issueDate}`,
        data: buildData(),
      });
      setMessage("Сохранено в историю");
    } catch {
      setMessage("Не удалось сохранить в историю");
    } finally {
      setIsSaving(false);
    }
  }

  const numberId = useId();
  const dateId = useId();

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-6">
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle>Доверенность (форма Д-1)</CardTitle>
            <CardDescription>На получение активов от поставщика</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={numberId} className="text-sm text-text-muted">
                  № доверенности
                </Label>
                <Input id={numberId} value={poaNumber} onChange={(e) => setPoaNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={dateId} className="text-sm text-text-muted">
                  Дата выдачи
                </Label>
                <Input
                  id={dateId}
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Получатель (ФИО, ИИН, адрес)</Label>
              <Input
                value={validUntilRecipient}
                onChange={(e) => setValidUntilRecipient(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Плательщик (пусто — из реквизитов)</Label>
              <Input value={validUntilPayer} onChange={(e) => setValidUntilPayer(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Счёт №</Label>
                <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="font-tabular" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Банк</Label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Должность получателя</Label>
                <Input value={issuedToPosition} onChange={(e) => setIssuedToPosition(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">ФИО получателя</Label>
                <Input value={issuedToName} onChange={(e) => setIssuedToName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Серия</Label>
                <Input value={idDocumentSeries} onChange={(e) => setIdDocumentSeries(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">№ документа</Label>
                <Input value={idDocumentNumber} onChange={(e) => setIdDocumentNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Дата выдачи</Label>
                <Input type="date" value={idDocumentDate} onChange={(e) => setIdDocumentDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Кем выдан документ</Label>
              <Input value={idDocumentIssuedBy} onChange={(e) => setIdDocumentIssuedBy(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Поставщик</Label>
              <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Основание (документ, номер, дата)</Label>
              <Input value={documentBasis} onChange={(e) => setDocumentBasis(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Активы к получению</CardTitle>
              <CardDescription>Доверенность № {poaNumber || "—"}</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
              <Plus className="h-4 w-4" />
              Добавить
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-text-muted">Наименование активов</TableHead>
                  <TableHead className="w-32 text-text-muted">Ед. измерения</TableHead>
                  <TableHead className="w-48 text-text-muted">Количество (прописью)</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input value={item.name} onChange={(e) => updateItem(item.id, { name: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <Input value={item.unit} onChange={(e) => updateItem(item.id, { unit: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.quantityInWords}
                        onChange={(e) => updateItem(item.id, { quantityInWords: e.target.value })}
                        placeholder="десять"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-text-muted hover:text-danger"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        aria-label="Удалить позицию"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {message ? <p className="mt-3 text-xs text-text-muted">{message}</p> : null}

            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={handleDownload} disabled={isDownloading} className="gap-2">
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Скачать PDF
              </Button>
              <Button onClick={handleSaveToHistory} disabled={isSaving} variant="outline" className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Сохранить в историю
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
