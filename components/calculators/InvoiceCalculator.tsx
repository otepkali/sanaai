"use client";

import { useId, useState } from "react";
import { Plus, Printer, X } from "lucide-react";
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
import { formatDateLong, formatDecimal, formatPercent, formatTenge } from "@/lib/format";
import type { VatMode } from "@/lib/vat";

interface EditableLineItem {
  id: number;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

let nextId = 1;
const createItem = (): EditableLineItem => ({
  id: nextId++,
  code: "",
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
  const [contractInfo, setContractInfo] = useState("Без договора");

  const [sellerName, setSellerName] = useState("");
  const [sellerBin, setSellerBin] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [buyerBin, setBuyerBin] = useState("");
  const [buyerDetails, setBuyerDetails] = useState("");

  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankBik, setBankBik] = useState("");
  const [kbe, setKbe] = useState("11");
  const [paymentPurposeCode, setPaymentPurposeCode] = useState("710");

  const [noticeText, setNoticeText] = useState(
    "Оплата данного счета означает согласие с условиями поставки товара. Уведомление об оплате обязательно, в противном случае не гарантируется наличие товара на складе. Товар отпускается по факту прихода денег на р/с Поставщика, самовывозом, при наличии доверенности и документов удостоверяющих личность."
  );

  const expenseId = useId();
  const invoiceNumberId = useId();
  const invoiceDateId = useId();
  const contractId = useId();
  const sellerNameId = useId();
  const sellerBinId = useId();
  const sellerAddressId = useId();
  const buyerBinId = useId();
  const buyerDetailsId = useId();
  const bankNameId = useId();
  const bankAccountId = useId();
  const bankBikId = useId();
  const kbeId = useId();
  const paymentPurposeCodeId = useId();
  const noticeId = useId();

  function updateItem(id: number, patch: Partial<EditableLineItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, createItem()]);
  }

  function removeItem(id: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  const plainItems = items.map(({ code, name, unit, quantity, unitPrice }) => ({
    code,
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
    <>
    <div className="grid gap-6 print:hidden lg:grid-cols-[380px_1fr]">
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
            <CardTitle className="text-lg">Стороны и договор</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={invoiceNumberId} className="text-sm text-text-muted">
                  № счёта
                </Label>
                <Input
                  id={invoiceNumberId}
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={invoiceDateId} className="text-sm text-text-muted">
                  Дата
                </Label>
                <Input
                  id={invoiceDateId}
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border p-3">
              <p className="text-sm font-medium">Поставщик</p>
              <div className="space-y-1.5">
                <Label htmlFor={sellerNameId} className="text-xs text-text-muted">
                  Наименование
                </Label>
                <Input
                  id={sellerNameId}
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder='Индивидуальный предприниматель "..."'
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={sellerBinId} className="text-xs text-text-muted">
                  БИН / ИИН
                </Label>
                <Input id={sellerBinId} value={sellerBin} onChange={(e) => setSellerBin(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={sellerAddressId} className="text-xs text-text-muted">
                  Адрес
                </Label>
                <Textarea
                  id={sellerAddressId}
                  value={sellerAddress}
                  onChange={(e) => setSellerAddress(e.target.value)}
                  placeholder="Республика Казахстан, г. ..., ул. ..."
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border p-3">
              <p className="text-sm font-medium">Покупатель</p>
              <div className="space-y-1.5">
                <Label htmlFor={buyerBinId} className="text-xs text-text-muted">
                  БИН / ИИН
                </Label>
                <Input id={buyerBinId} value={buyerBin} onChange={(e) => setBuyerBin(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={buyerDetailsId} className="text-xs text-text-muted">
                  Наименование и адрес
                </Label>
                <Textarea
                  id={buyerDetailsId}
                  value={buyerDetails}
                  onChange={(e) => setBuyerDetails(e.target.value)}
                  placeholder="Наименование, город, адрес"
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={contractId} className="text-sm text-text-muted">
                Договор
              </Label>
              <Input id={contractId} value={contractInfo} onChange={(e) => setContractInfo(e.target.value)} />
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
              <Label htmlFor={bankNameId} className="text-sm text-text-muted">
                Банк бенефициара
              </Label>
              <Input
                id={bankNameId}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder='АО "Банк", г. ...'
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={bankAccountId} className="text-sm text-text-muted">
                ИИК
              </Label>
              <Input
                id={bankAccountId}
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="KZ.............."
                className="font-tabular"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={bankBikId} className="text-sm text-text-muted">
                  БИК
                </Label>
                <Input id={bankBikId} value={bankBik} onChange={(e) => setBankBik(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={kbeId} className="text-sm text-text-muted">
                  Кбе
                </Label>
                <Input id={kbeId} value={kbe} onChange={(e) => setKbe(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={paymentPurposeCodeId} className="text-sm text-text-muted">
                  Код
                </Label>
                <Input
                  id={paymentPurposeCodeId}
                  value={paymentPurposeCode}
                  onChange={(e) => setPaymentPurposeCode(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={noticeId} className="text-sm text-text-muted">
                Текст уведомления вверху счёта
              </Label>
              <Textarea
                id={noticeId}
                value={noticeText}
                onChange={(e) => setNoticeText(e.target.value)}
                rows={4}
                className="text-xs"
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
            <div className="flex gap-2 print:hidden">
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                <Plus className="h-4 w-4" />
                Добавить позицию
              </Button>
              <Button type="button" size="sm" onClick={() => window.print()} className="gap-1">
                <Printer className="h-4 w-4" />
                Печать
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32 text-text-muted">Код</TableHead>
                  <TableHead className="text-text-muted">Наименование</TableHead>
                  <TableHead className="w-20 text-text-muted">Кол-во</TableHead>
                  <TableHead className="w-20 text-text-muted">Ед. изм.</TableHead>
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
                        value={item.code}
                        onChange={(e) => updateItem(item.id, { code: e.target.value })}
                        placeholder="—"
                      />
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
                        type="number"
                        min={0}
                        step="0.01"
                        className="font-tabular"
                        value={item.unitPrice || ""}
                        onChange={(e) =>
                          updateItem(item.id, { unitPrice: Math.max(0, Number(e.target.value) || 0) })
                        }
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell className="font-tabular text-right">
                      {formatDecimal(item.quantity * item.unitPrice)}
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

    <div className="hidden text-text print:block">
      {noticeText ? (
        <p className="mb-6 text-center text-xs leading-relaxed text-text-muted">{noticeText}</p>
      ) : null}

      <p className="mb-1 text-sm font-medium">Образец платежного поручения</p>
      <table className="mb-6 w-full border-collapse border border-text text-sm">
        <colgroup>
          <col className="w-1/2" />
          <col className="w-1/4" />
          <col className="w-1/4" />
        </colgroup>
        <tbody>
          <tr>
            <td className="border border-text p-2 align-top">
              <p className="font-medium">Бенефициар:</p>
              <p>{sellerName || "—"}</p>
              <p>ИИН: {sellerBin || "—"}</p>
            </td>
            <td className="border border-text p-2 text-center align-top">
              <p className="font-medium">ИИК</p>
              <p className="font-tabular mt-1">{bankAccount || "—"}</p>
            </td>
            <td className="border border-text p-2 text-center align-top">
              <p className="font-medium">Кбе</p>
              <p className="font-tabular mt-1">{kbe || "—"}</p>
            </td>
          </tr>
          <tr>
            <td className="border border-text p-2 align-top">
              <p className="font-medium">Банк бенефициара:</p>
              <p>{bankName || "—"}</p>
            </td>
            <td className="border border-text p-2 text-center align-top">
              <p className="font-medium">БИК</p>
              <p className="font-tabular mt-1">{bankBik || "—"}</p>
            </td>
            <td className="border border-text p-2 text-center align-top">
              <p className="font-medium">Код назначения платежа</p>
              <p className="font-tabular mt-1">{paymentPurposeCode || "—"}</p>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className="mb-4 text-xl font-semibold">
        Счёт на оплату № {invoiceNumber || "—"} от {formatDateLong(invoiceDate)}
      </h2>

      <div className="mb-4 space-y-1 text-sm">
        <p>
          <span className="font-medium">Поставщик:</span> БИН/ИИН {sellerBin || "—"}
          {sellerName ? `, ${sellerName}` : ""}
          {sellerAddress ? `, ${sellerAddress}` : ""}
        </p>
        <p>
          <span className="font-medium">Покупатель:</span> БИН/ИИН {buyerBin || "—"}
          {buyerDetails ? `, ${buyerDetails}` : ""}
        </p>
        <p>
          <span className="font-medium">Договор:</span> {contractInfo || "Без договора"}
        </p>
      </div>

      <table className="w-full border-collapse border border-text text-sm">
        <thead>
          <tr>
            <th className="border border-text px-2 py-1.5 text-left">№</th>
            <th className="border border-text px-2 py-1.5 text-left">Код</th>
            <th className="border border-text px-2 py-1.5 text-left">Наименование</th>
            <th className="border border-text px-2 py-1.5 text-right">Кол-во</th>
            <th className="border border-text px-2 py-1.5 text-left">Ед.</th>
            <th className="border border-text px-2 py-1.5 text-right">Цена</th>
            <th className="border border-text px-2 py-1.5 text-right">Сумма</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td className="border border-text px-2 py-1.5">{index + 1}</td>
              <td className="border border-text px-2 py-1.5">{item.code || "—"}</td>
              <td className="border border-text px-2 py-1.5">{item.name || "—"}</td>
              <td className="font-tabular border border-text px-2 py-1.5 text-right">
                {formatDecimal(item.quantity, 3)}
              </td>
              <td className="border border-text px-2 py-1.5">{item.unit}</td>
              <td className="font-tabular border border-text px-2 py-1.5 text-right">
                {formatDecimal(item.unitPrice, 2)}
              </td>
              <td className="font-tabular border border-text px-2 py-1.5 text-right">
                {formatDecimal(item.quantity * item.unitPrice, 2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 flex justify-end">
        <div className="w-72 space-y-1 text-sm">
          <div className="flex justify-between font-semibold">
            <span>Итого:</span>
            <span className="font-tabular">{formatDecimal(result.grossAmount, 2)}</span>
          </div>
          {isVatPayer ? (
            <div className="flex justify-between">
              <span>В том числе НДС:</span>
              <span className="font-tabular">{formatDecimal(result.vatAmount, 2)}</span>
            </div>
          ) : null}
        </div>
      </div>

      <p className="mt-4 text-sm">
        Всего наименований {items.length}, на сумму {formatDecimal(result.grossAmount, 2)} KZT
      </p>
      <p className="mt-1 text-sm font-semibold">Всего к оплате: {result.amountInWords}</p>

      <div className="mt-8 text-sm">
        <p className="mb-2 font-medium">Налоговый блок (справка-расчёт)</p>
        {isVatPayer ? (
          <div className="flex justify-between">
            <span>НДС ({formatPercent(result.vatRate)})</span>
            <span className="font-tabular">{formatTenge(result.vatAmount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span>Налогооблагаемый доход (сумма без НДС − расходы)</span>
          <span className="font-tabular">{formatTenge(result.taxableProfit)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>
            {entityType === "too" ? "КПН" : "ИПН"} ({formatPercent(result.profitTaxRate)} от прибыли)
          </span>
          <span className="font-tabular">{formatTenge(result.profitTax)}</span>
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Итоговый {entityType === "too" ? "КПН" : "ИПН"} рассчитывается по итогам налогового
          периода (года) на основе всех фактически накопленных и документально подтверждённых
          вычетов. Расчёт выше — иллюстративная оценка по одной сделке.
        </p>
      </div>

      <div className="mt-10 flex items-end gap-2 text-sm">
        <span>Исполнитель</span>
        <span className="flex-1 border-b border-text">&nbsp;</span>
        <span>/Руководитель/</span>
      </div>
    </div>
    </>
  );
}
