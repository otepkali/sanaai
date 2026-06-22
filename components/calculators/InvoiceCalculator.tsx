"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResultBreakdown, type BreakdownRow } from "@/components/ResultBreakdown";
import { calculateInvoice, type InvoiceEntityType } from "@/lib/invoice";
import { invoiceFormSchema } from "@/lib/schemas";
import { formatAmountInput, formatNumber, formatPercent, formatTenge, parseAmountInput } from "@/lib/format";
import type { VatMode } from "@/lib/vat";

interface EditableLineItem {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

let nextId = 1;
const createItem = (): EditableLineItem => ({
  id: nextId++,
  name: "",
  unit: "шт.",
  quantity: 1,
  unitPrice: 0,
});

export function InvoiceCalculator() {
  const [items, setItems] = useState<EditableLineItem[]>(() => [
    { ...createItem(), name: "Поставка оборудования", unitPrice: 1_000_000 },
  ]);
  const [isVatPayer, setIsVatPayer] = useState(true);
  const [vatMode, setVatMode] = useState<VatMode>("exclusive");
  const [entityType, setEntityType] = useState<InvoiceEntityType>("too");
  const [expenseSharePercent, setExpenseSharePercent] = useState(0);

  const [invoiceNumber, setInvoiceNumber] = useState("1");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [seller, setSeller] = useState("");
  const [buyer, setBuyer] = useState("");

  const expenseId = useId();

  function updateItem(id: number, patch: Partial<EditableLineItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, createItem()]);
  }

  function removeItem(id: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  const plainItems = items.map(({ name, unit, quantity, unitPrice }) => ({
    name,
    unit,
    quantity,
    unitPrice,
  }));

  const validation = invoiceFormSchema.safeParse({
    items: plainItems,
    isVatPayer,
    vatMode,
    entityType,
    expenseSharePercent,
  });

  const result = calculateInvoice({
    items: plainItems,
    isVatPayer,
    vatMode,
    entityType,
    expenseSharePercent,
  });

  const taxRows: BreakdownRow[] = [];
  if (isVatPayer) {
    taxRows.push({ label: `НДС (${formatPercent(result.vatRate)})`, value: result.vatAmount });
  }
  taxRows.push({
    label: "Налогооблагаемый доход (сумма без НДС − расходы)",
    value: result.taxableProfit,
    tone: "muted",
  });
  taxRows.push({
    label: `${entityType === "too" ? "КПН" : "ИПН"} (${formatPercent(result.profitTaxRate)} от прибыли)`,
    value: result.profitTax,
    bold: true,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-6">
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle>Счёт на оплату</CardTitle>
            <CardDescription>ОУР — налог считается с прибыли, не с оборота</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Организационная форма</Label>
              <Select value={entityType} onValueChange={(v) => setEntityType(v as InvoiceEntityType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="too">ТОО на ОУР (КПН 20%)</SelectItem>
                  <SelectItem value="ip">ИП на ОУР (ИПН 10%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div>
                <Label htmlFor="vat-payer" className="text-sm">
                  Плательщик НДС
                </Label>
                <p className="text-xs text-text-muted">Ставка 16%</p>
              </div>
              <Switch id="vat-payer" checked={isVatPayer} onCheckedChange={setIsVatPayer} />
            </div>

            {isVatPayer ? (
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Цены в позициях указаны</Label>
                <Select value={vatMode} onValueChange={(v) => setVatMode(v as VatMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exclusive">Без НДС — начислить сверху</SelectItem>
                    <SelectItem value="inclusive">С НДС — выделить «в т.ч.»</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor={expenseId} className="text-sm text-text-muted">
                Доля расходов по сделке
              </Label>
              <div className="relative">
                <Input
                  id={expenseId}
                  type="number"
                  min={0}
                  max={100}
                  inputMode="numeric"
                  value={expenseSharePercent || ""}
                  onChange={(e) =>
                    setExpenseSharePercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                  }
                  placeholder="0"
                  className="font-tabular pr-8"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-text-muted">
                  %
                </span>
              </div>
              <p className="text-xs text-text-muted">
                Если неизвестно — оставьте 0%, налог посчитается от полной суммы без НДС.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Реквизиты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">№ счёта</Label>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-text-muted">Дата</Label>
                <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Поставщик</Label>
              <Textarea
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                placeholder="Наименование, БИН/ИИН, банковские реквизиты"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-text-muted">Покупатель</Label>
              <Textarea
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                placeholder="Наименование, БИН/ИИН"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Позиции</CardTitle>
              <CardDescription>Счёт № {invoiceNumber || "—"} от {invoiceDate || "—"}</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
              <Plus className="h-4 w-4" />
              Добавить позицию
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-text-muted">Наименование</TableHead>
                  <TableHead className="w-20 text-text-muted">Кол-во</TableHead>
                  <TableHead className="w-20 text-text-muted">Ед. изм.</TableHead>
                  <TableHead className="w-36 text-text-muted">Цена</TableHead>
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
                        placeholder="Наименование товара/услуги"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="font-tabular"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          updateItem(item.id, { quantity: Math.max(0, Number(e.target.value) || 0) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input value={item.unit} onChange={(e) => updateItem(item.id, { unit: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <Input
                        inputMode="numeric"
                        className="font-tabular"
                        value={formatAmountInput(item.unitPrice)}
                        onChange={(e) =>
                          updateItem(item.id, { unitPrice: parseAmountInput(e.target.value) })
                        }
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell className="font-tabular text-right">
                      {formatNumber(item.quantity * item.unitPrice)}
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
            {!validation.success ? (
              <p className="mt-3 text-xs text-danger">{validation.error.issues[0]?.message}</p>
            ) : null}

            <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Сумма без НДС</span>
                <span className="font-tabular">{formatTenge(result.netAmount)}</span>
              </div>
              {isVatPayer ? (
                <div className="flex justify-between text-text-muted">
                  <span>В том числе НДС ({formatPercent(result.vatRate)})</span>
                  <span className="font-tabular">{formatTenge(result.vatAmount)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-text-muted">
                  <span>НДС</span>
                  <span>Без НДС</span>
                </div>
              )}
              <div className="flex justify-between rounded-lg bg-primary-bg px-3 py-3 text-base font-semibold text-primary">
                <span>Итого к оплате</span>
                <span className="font-tabular">{formatTenge(result.grossAmount)}</span>
              </div>
              <p className="text-xs italic text-text-muted">{result.amountInWords}</p>
            </div>
          </CardContent>
        </Card>

        <ResultBreakdown
          title="Налоговый блок (справка-расчёт)"
          highlights={[
            {
              label: entityType === "too" ? "КПН к уплате" : "ИПН к уплате",
              value: result.profitTax,
            },
          ]}
          rows={taxRows}
        />
        <p className="text-xs leading-relaxed text-text-muted">
          Итоговый {entityType === "too" ? "КПН" : "ИПН"} рассчитывается по итогам налогового
          периода (года) на основе всех фактически накопленных и документально подтверждённых
          вычетов. Расчёт выше — иллюстративная оценка по одной сделке.
        </p>
      </div>
    </div>
  );
}
