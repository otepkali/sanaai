"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { Download, Loader2, Plus, X } from "lucide-react";
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
import { MoneyInput } from "@/components/calculators/MoneyInput";
import { calculateInvoiceTotals, formatMoney } from "@/lib/invoice/calc";
import type { InvoiceData, InvoiceItem, VatMode } from "@/lib/invoice/types";
import { formatTenge } from "@/lib/format";

interface EditableItem extends InvoiceItem {
  id: number;
}

let nextId = 1;
const createItem = (): EditableItem => ({
  id: nextId++,
  code: "",
  name: "",
  unit: "шт.",
  qty: 1,
  price: 0,
});

const LAST_INVOICE_NUMBER_KEY = "sana-invoice-last-number";

/** Если последний номер счёта был чисто числовым — предлагаем следующий по порядку */
function nextInvoiceNumber(lastNumber: string): string {
  return /^\d+$/.test(lastNumber) ? String(Number(lastNumber) + 1) : lastNumber;
}

const noopSubscribe = () => () => {};

function readSuggestedInvoiceNumber(): string {
  const lastNumber = localStorage.getItem(LAST_INVOICE_NUMBER_KEY);
  return lastNumber ? nextInvoiceNumber(lastNumber) : "1";
}

/** Подставляет следующий по порядку номер счёта (как в обычной бухгалтерской
 *  программе), без рассинхронизации с серверным рендером — см. theme-toggle.tsx. */
function useSuggestedInvoiceNumber(): string {
  return useSyncExternalStore(noopSubscribe, readSuggestedInvoiceNumber, () => "1");
}

export function InvoiceForm() {
  const [items, setItems] = useState<EditableItem[]>(() => [createItem()]);
  const [isVatPayer, setIsVatPayer] = useState(true);
  const [vatMode, setVatMode] = useState<VatMode>("inclusive");
  const [showTaxBlock, setShowTaxBlock] = useState(false);
  const [taxableIncome, setTaxableIncome] = useState(0);

  const suggestedNumber = useSuggestedInvoiceNumber();
  const [numberOverride, setNumberOverride] = useState<string | null>(null);
  const number = numberOverride ?? suggestedNumber;

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [contract, setContract] = useState("Без договора");

  const [supplierName, setSupplierName] = useState("");
  const [supplierBin, setSupplierBin] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");

  const [buyerName, setBuyerName] = useState("");
  const [buyerBin, setBuyerBin] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");

  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryIin, setBeneficiaryIin] = useState("");
  const [beneficiaryIik, setBeneficiaryIik] = useState("");
  const [beneficiaryKbe, setBeneficiaryKbe] = useState("11");
  const [beneficiaryBankName, setBeneficiaryBankName] = useState("");
  const [beneficiaryBik, setBeneficiaryBik] = useState("");
  const [beneficiaryKnp, setBeneficiaryKnp] = useState("710");

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const numberId = useId();
  const dateId = useId();
  const contractId = useId();
  const supplierNameId = useId();
  const supplierBinId = useId();
  const supplierAddressId = useId();
  const buyerNameId = useId();
  const buyerBinId = useId();
  const buyerAddressId = useId();
  const beneficiaryNameId = useId();
  const beneficiaryIinId = useId();
  const beneficiaryIikId = useId();
  const beneficiaryKbeId = useId();
  const beneficiaryBankNameId = useId();
  const beneficiaryBikId = useId();
  const beneficiaryKnpId = useId();

  function updateItem(id: number, patch: Partial<EditableItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, createItem()]);
  }

  function removeItem(id: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  function buildInvoiceData(): InvoiceData {
    return {
      number,
      date,
      beneficiary: {
        name: beneficiaryName,
        iin: beneficiaryIin,
        iik: beneficiaryIik,
        kbe: beneficiaryKbe,
        bankName: beneficiaryBankName,
        bik: beneficiaryBik,
        knp: beneficiaryKnp,
      },
      supplier: { binIin: supplierBin, name: supplierName, address: supplierAddress },
      buyer: { binIin: buyerBin, name: buyerName, address: buyerAddress },
      contract,
      items: items.map(({ code, name, qty, unit, price }) => ({ code, name, qty, unit, price })),
      isVatPayer,
      vatMode,
      showTaxBlock,
      taxableIncome,
    };
  }

  const preview = calculateInvoiceTotals(buildInvoiceData());

  async function handleDownload() {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const response = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildInvoiceData()),
      });

      if (!response.ok) {
        const errorBody: { error?: unknown } | null = await response.json().catch(() => null);
        const detail = typeof errorBody?.error === "string" ? errorBody.error : null;
        setDownloadError(detail ? `Не удалось сформировать счёт: ${detail}` : "Не удалось сформировать счёт.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `schet-${number || "invoice"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      localStorage.setItem(LAST_INVOICE_NUMBER_KEY, number);
      setNumberOverride(nextInvoiceNumber(number));
    } catch {
      setDownloadError("Не удалось связаться с сервером. Попробуйте ещё раз.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-6">
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle>Счёт на оплату</CardTitle>
            <CardDescription>PDF, сгенерированный на сервере — вид как из 1С</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div>
                <Label htmlFor="is-vat-payer" className="text-sm">
                  Плательщик НДС
                </Label>
                <p className="text-xs text-text-muted">Ставка 16%</p>
              </div>
              <Switch id="is-vat-payer" checked={isVatPayer} onCheckedChange={setIsVatPayer} />
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

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div>
                <Label htmlFor="show-tax-block" className="text-sm">
                  Показать налоговый блок
                </Label>
                <p className="text-xs text-text-muted">Справка-расчёт ИПН под счётом</p>
              </div>
              <Switch id="show-tax-block" checked={showTaxBlock} onCheckedChange={setShowTaxBlock} />
            </div>

            {showTaxBlock ? (
              <MoneyInput
                label="Налогооблагаемый доход"
                value={taxableIncome}
                onChange={setTaxableIncome}
                hint="Сумма без НДС за вычетом расходов"
              />
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={numberId} className="text-sm text-text-muted">
                  № счёта
                </Label>
                <Input id={numberId} value={number} onChange={(e) => setNumberOverride(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={dateId} className="text-sm text-text-muted">
                  Дата
                </Label>
                <Input id={dateId} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={contractId} className="text-sm text-text-muted">
                Договор
              </Label>
              <Input id={contractId} value={contract} onChange={(e) => setContract(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Стороны</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-xl border border-border p-3">
              <p className="text-sm font-medium">Поставщик</p>
              <div className="space-y-1.5">
                <Label htmlFor={supplierNameId} className="text-xs text-text-muted">
                  Наименование
                </Label>
                <Input id={supplierNameId} value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={supplierBinId} className="text-xs text-text-muted">
                  БИН / ИИН
                </Label>
                <Input id={supplierBinId} value={supplierBin} onChange={(e) => setSupplierBin(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={supplierAddressId} className="text-xs text-text-muted">
                  Адрес
                </Label>
                <Textarea
                  id={supplierAddressId}
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border p-3">
              <p className="text-sm font-medium">Покупатель</p>
              <div className="space-y-1.5">
                <Label htmlFor={buyerNameId} className="text-xs text-text-muted">
                  Наименование
                </Label>
                <Input id={buyerNameId} value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={buyerBinId} className="text-xs text-text-muted">
                  БИН / ИИН
                </Label>
                <Input id={buyerBinId} value={buyerBin} onChange={(e) => setBuyerBin(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={buyerAddressId} className="text-xs text-text-muted">
                  Адрес
                </Label>
                <Textarea
                  id={buyerAddressId}
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Платёжные реквизиты</CardTitle>
            <CardDescription>Для образца платёжного поручения на счёте</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={beneficiaryNameId} className="text-sm text-text-muted">
                Бенефициар (наименование)
              </Label>
              <Input
                id={beneficiaryNameId}
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={beneficiaryIinId} className="text-sm text-text-muted">
                ИИН / БИН бенефициара
              </Label>
              <Input id={beneficiaryIinId} value={beneficiaryIin} onChange={(e) => setBeneficiaryIin(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={beneficiaryBankNameId} className="text-sm text-text-muted">
                Банк бенефициара
              </Label>
              <Input
                id={beneficiaryBankNameId}
                value={beneficiaryBankName}
                onChange={(e) => setBeneficiaryBankName(e.target.value)}
                placeholder='АО "Банк", г. ...'
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={beneficiaryIikId} className="text-sm text-text-muted">
                ИИК
              </Label>
              <Input
                id={beneficiaryIikId}
                value={beneficiaryIik}
                onChange={(e) => setBeneficiaryIik(e.target.value)}
                placeholder="KZ.............."
                className="font-tabular"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={beneficiaryBikId} className="text-sm text-text-muted">
                  БИК
                </Label>
                <Input id={beneficiaryBikId} value={beneficiaryBik} onChange={(e) => setBeneficiaryBik(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={beneficiaryKbeId} className="text-sm text-text-muted">
                  Кбе
                </Label>
                <Input id={beneficiaryKbeId} value={beneficiaryKbe} onChange={(e) => setBeneficiaryKbe(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={beneficiaryKnpId} className="text-sm text-text-muted">
                  Код
                </Label>
                <Input id={beneficiaryKnpId} value={beneficiaryKnp} onChange={(e) => setBeneficiaryKnp(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Позиции</CardTitle>
              <CardDescription>
                Счёт № {number || "—"} от {date || "—"}
              </CardDescription>
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
                  <TableHead className="w-32 text-text-muted">Код</TableHead>
                  <TableHead className="text-text-muted">Наименование</TableHead>
                  <TableHead className="w-20 text-text-muted">Кол-во</TableHead>
                  <TableHead className="w-20 text-text-muted">Ед.</TableHead>
                  <TableHead className="w-32 text-text-muted">Цена</TableHead>
                  <TableHead className="w-36 text-right text-text-muted">Сумма</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input value={item.code} onChange={(e) => updateItem(item.id, { code: e.target.value })} placeholder="—" />
                    </TableCell>
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
                        step="0.001"
                        className="font-tabular"
                        value={item.qty || ""}
                        onChange={(e) => updateItem(item.id, { qty: Math.max(0, Number(e.target.value) || 0) })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input value={item.unit} onChange={(e) => updateItem(item.id, { unit: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="font-tabular"
                        value={item.price || ""}
                        onChange={(e) => updateItem(item.id, { price: Math.max(0, Number(e.target.value) || 0) })}
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell className="font-tabular text-right">{formatMoney(item.qty * item.price)}</TableCell>
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

            <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Итого</span>
                <span className="font-tabular">{formatTenge(preview.subtotal)}</span>
              </div>
              {preview.vatAmount !== null ? (
                <div className="flex justify-between text-text-muted">
                  <span>{vatMode === "exclusive" ? "Кроме того НДС" : "В том числе НДС"}</span>
                  <span className="font-tabular">{formatTenge(preview.vatAmount)}</span>
                </div>
              ) : null}
              {showTaxBlock ? (
                <div className="flex justify-between text-text-muted">
                  <span>ИПН (10% от налогооблагаемого дохода)</span>
                  <span className="font-tabular">{formatTenge(preview.ipnAmount ?? 0)}</span>
                </div>
              ) : null}
              <div className="flex justify-between rounded-lg bg-primary-bg px-3 py-3 text-base font-semibold text-primary">
                <span>Всего к оплате</span>
                <span className="font-tabular">{formatTenge(preview.grossAmount)}</span>
              </div>
              <p className="text-xs italic text-text-muted">{preview.amountInWords}</p>
            </div>

            {downloadError ? <p className="mt-3 text-xs text-danger">{downloadError}</p> : null}

            <Button onClick={handleDownload} disabled={isDownloading} className="mt-4 w-full gap-2">
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Скачать счёт
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
