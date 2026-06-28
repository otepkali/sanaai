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
import type { WaybillData, WaybillItem } from "@/lib/documents/types";

interface EditableItem extends WaybillItem {
  id: number;
}

const VAT_RATE = 0.16;

let nextId = 1;
const createItem = (): EditableItem => ({
  id: nextId++,
  name: "",
  nomenclatureNumber: "",
  unit: "шт.",
  quantityToRelease: 1,
  quantityReleased: 1,
  price: 0,
  sumWithVat: 0,
  vatSum: 0,
});

export function WaybillForm() {
  const { user } = useUser();
  const [documentNumber, setDocumentNumber] = useState("1");
  const [documentDate, setDocumentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recipientName, setRecipientName] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [transportOrganization, setTransportOrganization] = useState("");
  const [transportDocument, setTransportDocument] = useState("");
  const [poaNumber, setPoaNumber] = useState("");
  const [poaDate, setPoaDate] = useState("");
  const [poaIssuedTo, setPoaIssuedTo] = useState("");
  const [items, setItems] = useState<EditableItem[]>(() => [createItem()]);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateItem(id: number, patch: Partial<EditableItem>) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        const sumWithVat = next.quantityReleased * next.price;
        const vatSum = (sumWithVat * VAT_RATE) / (1 + VAT_RATE);
        return { ...next, sumWithVat, vatSum };
      })
    );
  }
  function addItem() {
    setItems((prev) => [...prev, createItem()]);
  }
  function removeItem(id: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  function buildData(): WaybillData {
    return {
      documentNumber,
      documentDate,
      senderName: "",
      recipientName,
      responsiblePerson,
      transportOrganization,
      transportDocument,
      poaNumber,
      poaDate,
      poaIssuedTo,
      items: items.map(
        ({ name, nomenclatureNumber, unit, quantityToRelease, quantityReleased, price, sumWithVat, vatSum }) => ({
          name,
          nomenclatureNumber,
          unit,
          quantityToRelease,
          quantityReleased,
          price,
          sumWithVat,
          vatSum,
        })
      ),
    };
  }

  const total = items.reduce((sum, item) => sum + item.sumWithVat, 0);

  async function handleDownload() {
    setMessage(null);
    setIsDownloading(true);
    try {
      const response = await fetch("/api/documents/waybill-pdf", {
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
      link.download = `waybill-${documentNumber || "1"}.pdf`;
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
        type: "waybill",
        title: `Накладная № ${documentNumber || "—"} от ${documentDate}`,
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
            <CardTitle>Накладная (форма З-2)</CardTitle>
            <CardDescription>На отпуск запасов на сторону</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={numberId} className="text-sm text-text-muted">
                  № документа
                </Label>
                <Input id={numberId} value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={dateId} className="text-sm text-text-muted">
                  Дата составления
                </Label>
                <Input
                  id={dateId}
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Получатель</Label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Ответственный за поставку (Ф.И.О.)</Label>
              <Input value={responsiblePerson} onChange={(e) => setResponsiblePerson(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Транспортная организация</Label>
              <Input value={transportOrganization} onChange={(e) => setTransportOrganization(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Товарно-транспортная накладная (номер, дата)</Label>
              <Input value={transportDocument} onChange={(e) => setTransportDocument(e.target.value)} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">№ доверенности</Label>
                <Input value={poaNumber} onChange={(e) => setPoaNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Дата</Label>
                <Input value={poaDate} onChange={(e) => setPoaDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Выдана</Label>
                <Input value={poaIssuedTo} onChange={(e) => setPoaIssuedTo(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Запасы к отпуску</CardTitle>
              <CardDescription>
                Накладная № {documentNumber || "—"} от {documentDate || "—"}
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
                  <TableHead className="w-24 text-text-muted">Номенкл. №</TableHead>
                  <TableHead className="w-20 text-text-muted">Ед.</TableHead>
                  <TableHead className="w-24 text-text-muted">Кол-во</TableHead>
                  <TableHead className="w-28 text-text-muted">Цена</TableHead>
                  <TableHead className="w-36 text-right text-text-muted">Сумма с НДС</TableHead>
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
                      <Input
                        value={item.nomenclatureNumber}
                        onChange={(e) => updateItem(item.id, { nomenclatureNumber: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input value={item.unit} onChange={(e) => updateItem(item.id, { unit: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="font-tabular"
                        value={item.quantityReleased || ""}
                        onChange={(e) => {
                          const value = Math.max(0, Number(e.target.value) || 0);
                          updateItem(item.id, { quantityReleased: value, quantityToRelease: value });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="font-tabular"
                        value={item.price || ""}
                        onChange={(e) => updateItem(item.id, { price: Math.max(0, Number(e.target.value) || 0) })}
                      />
                    </TableCell>
                    <TableCell className="font-tabular text-right">{formatTenge(item.sumWithVat)}</TableCell>
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
              <span>Итого с НДС: {formatTenge(total)}</span>
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
