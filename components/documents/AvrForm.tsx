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
import { formatTenge } from "@/lib/format";
import type { AvrData, AvrItem } from "@/lib/documents/types";

interface EditableItem extends AvrItem {
  id: number;
}

let nextId = 1;
const createItem = (): EditableItem => ({
  id: nextId++,
  name: "",
  reportInfo: "",
  unit: "шт.",
  quantity: 1,
  price: 0,
});

export function AvrForm() {
  const { user } = useUser();
  const [documentNumber, setDocumentNumber] = useState("1");
  const [documentDate, setDocumentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerBinIin, setCustomerBinIin] = useState("");
  const [executorName, setExecutorName] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [contractDate, setContractDate] = useState("");
  const [items, setItems] = useState<EditableItem[]>(() => [createItem()]);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const documentNumberId = useId();
  const documentDateId = useId();
  const periodFromId = useId();
  const periodToId = useId();
  const customerNameId = useId();
  const customerBinIinId = useId();
  const executorNameId = useId();
  const contractNumberId = useId();
  const contractDateId = useId();

  function updateItem(id: number, patch: Partial<EditableItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }
  function addItem() {
    setItems((prev) => [...prev, createItem()]);
  }
  function removeItem(id: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  function buildData(): AvrData {
    return {
      documentNumber,
      documentDate,
      periodFrom,
      periodTo,
      customerName,
      customerBinIin,
      executorName,
      contractNumber,
      contractDate,
      reservesInfo: "",
      attachmentPages: "",
      items: items.map(({ name, reportInfo, unit, quantity, price }) => ({
        name,
        reportInfo,
        unit,
        quantity,
        price,
      })),
    };
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  async function handleDownload() {
    setMessage(null);
    setIsDownloading(true);
    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "avr", data: buildData() }),
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
      link.download = `avr-${documentNumber || "1"}.pdf`;
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
        type: "avr",
        title: `АВР № ${documentNumber || "—"} от ${documentDate}`,
        data: buildData(),
      });
      setMessage("Сохранено в историю");
    } catch {
      setMessage("Не удалось сохранить в историю");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-6">
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle>АВР (форма Р-1)</CardTitle>
            <CardDescription>Акт выполненных работ (оказанных услуг)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={documentNumberId} className="text-sm text-text-muted">
                  № документа
                </Label>
                <Input
                  id={documentNumberId}
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={documentDateId} className="text-sm text-text-muted">
                  Дата составления
                </Label>
                <Input
                  id={documentDateId}
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={periodFromId} className="text-sm text-text-muted">
                  Отчётный период с
                </Label>
                <Input
                  id={periodFromId}
                  value={periodFrom}
                  onChange={(e) => setPeriodFrom(e.target.value)}
                  placeholder="01.06.2026"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={periodToId} className="text-sm text-text-muted">
                  по
                </Label>
                <Input
                  id={periodToId}
                  value={periodTo}
                  onChange={(e) => setPeriodTo(e.target.value)}
                  placeholder="30.06.2026"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={customerNameId} className="text-sm text-text-muted">
                Заказчик
              </Label>
              <Input
                id={customerNameId}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder='ТОО "Заказчик", БИН ..., адрес'
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={customerBinIinId} className="text-sm text-text-muted">
                БИН/ИИН заказчика
              </Label>
              <Input
                id={customerBinIinId}
                value={customerBinIin}
                onChange={(e) => setCustomerBinIin(e.target.value)}
                className="font-tabular"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={executorNameId} className="text-sm text-text-muted">
                Исполнитель (пусто — из реквизитов компании)
              </Label>
              <Input
                id={executorNameId}
                value={executorName}
                onChange={(e) => setExecutorName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={contractNumberId} className="text-sm text-text-muted">
                  № договора
                </Label>
                <Input
                  id={contractNumberId}
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={contractDateId} className="text-sm text-text-muted">
                  Дата договора
                </Label>
                <Input
                  id={contractDateId}
                  value={contractDate}
                  onChange={(e) => setContractDate(e.target.value)}
                  placeholder="01.01.2026"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Выполненные работы (услуги)</CardTitle>
              <CardDescription>
                Акт № {documentNumber || "—"} от {documentDate || "—"}
              </CardDescription>
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
                  <TableHead className="text-text-muted">Наименование</TableHead>
                  <TableHead className="w-24 text-text-muted">Ед.</TableHead>
                  <TableHead className="w-24 text-text-muted">Кол-во</TableHead>
                  <TableHead className="w-32 text-text-muted">Цена</TableHead>
                  <TableHead className="w-36 text-right text-text-muted">Сумма</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        placeholder="Наименование работ/услуг"
                      />
                    </TableCell>
                    <TableCell>
                      <Input value={item.unit} onChange={(e) => updateItem(item.id, { unit: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.001"
                        className="font-tabular"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          updateItem(item.id, { quantity: Math.max(0, Number(e.target.value) || 0) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="font-tabular"
                        value={item.price || ""}
                        onChange={(e) =>
                          updateItem(item.id, { price: Math.max(0, Number(e.target.value) || 0) })
                        }
                      />
                    </TableCell>
                    <TableCell className="font-tabular text-right">
                      {formatTenge(item.quantity * item.price)}
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

            <div className="mt-5 flex justify-end rounded-lg bg-primary-bg px-4 py-3 text-base font-semibold text-primary">
              <span>Итого: {formatTenge(total)}</span>
            </div>

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
