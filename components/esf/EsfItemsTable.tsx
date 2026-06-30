"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTenge } from "@/lib/format";
import { createEmptyItem, type EsfItem } from "@/lib/esf/types";

const VAT_RATE_OPTIONS = ["12", "0", "Без НДС"];

function computeItem(item: EsfItem): EsfItem {
  const sum = item.quantity * item.price;
  const exciseSum = item.exciseSum;
  const vatSum = item.vatRate === "Без НДС" || !item.vatRate ? 0 : Math.round(((sum * Number(item.vatRate)) / 100) * 100) / 100;
  return { ...item, sum, vatSum, sumWithTax: sum + vatSum + exciseSum };
}

function ItemRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: EsfItem;
  index: number;
  onChange: (item: EsfItem) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rowId = useId();

  function patch(fields: Partial<EsfItem>) {
    onChange(computeItem({ ...item, ...fields }));
  }

  return (
    <>
      <TableRow>
        <TableCell>{index + 1}</TableCell>
        <TableCell className="min-w-[160px]">
          <Input value={item.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Наименование" />
        </TableCell>
        <TableCell className="w-24">
          <Input value={item.unit} onChange={(e) => patch({ unit: e.target.value })} placeholder="шт." />
        </TableCell>
        <TableCell className="w-20">
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => patch({ quantity: Number(e.target.value) || 0 })}
          />
        </TableCell>
        <TableCell className="w-28">
          <Input type="number" value={item.price} onChange={(e) => patch({ price: Number(e.target.value) || 0 })} />
        </TableCell>
        <TableCell className="text-right font-tabular">{formatTenge(item.sum)}</TableCell>
        <TableCell className="w-28">
          <Select value={item.vatRate} onValueChange={(v) => patch({ vatRate: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Ставка" />
            </SelectTrigger>
            <SelectContent>
              {VAT_RATE_OPTIONS.map((rate) => (
                <SelectItem key={rate} value={rate}>
                  {rate === "Без НДС" ? rate : `${rate}%`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="text-right font-tabular">{formatTenge(item.vatSum)}</TableCell>
        <TableCell className="text-right font-tabular">{formatTenge(item.sumWithTax)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-text-muted transition-colors hover:text-text"
              aria-label="Дополнительные поля"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="text-text-muted transition-colors hover:text-danger"
              aria-label="Удалить позицию"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </TableCell>
      </TableRow>

      {expanded ? (
        <TableRow>
          <TableCell colSpan={10} className="bg-surface-tint">
            <div className="grid gap-3 p-2 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor={`${rowId}-origin`} className="text-xs text-text-muted">
                  Признак происхождения
                </Label>
                <Input id={`${rowId}-origin`} value={item.originFlag} onChange={(e) => patch({ originFlag: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${rowId}-tnved-name`} className="text-xs text-text-muted">
                  Наименование по Декларации / заявлению
                </Label>
                <Input id={`${rowId}-tnved-name`} value={item.tnvedName} onChange={(e) => patch({ tnvedName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${rowId}-tnved-code`} className="text-xs text-text-muted">
                  Код товара (ТН ВЭД ЕАЭС)
                </Label>
                <Input id={`${rowId}-tnved-code`} value={item.tnvedCode} onChange={(e) => patch({ tnvedCode: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${rowId}-excise-rate`} className="text-xs text-text-muted">
                  Акциз — ставка
                </Label>
                <Input id={`${rowId}-excise-rate`} value={item.exciseRate} onChange={(e) => patch({ exciseRate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${rowId}-excise-sum`} className="text-xs text-text-muted">
                  Акциз — сумма
                </Label>
                <Input
                  id={`${rowId}-excise-sum`}
                  type="number"
                  value={item.exciseSum}
                  onChange={(e) => patch({ exciseSum: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${rowId}-turnover`} className="text-xs text-text-muted">
                  Размер оборота по реализации
                </Label>
                <Input id={`${rowId}-turnover`} value={item.turnoverInfo} onChange={(e) => patch({ turnoverInfo: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${rowId}-declaration`} className="text-xs text-text-muted">
                  № Декларации на товары / СТ-1 / СТ-KZ
                </Label>
                <Input
                  id={`${rowId}-declaration`}
                  value={item.declarationNumber}
                  onChange={(e) => patch({ declarationNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${rowId}-trade-position`} className="text-xs text-text-muted">
                  Номер товарной позиции
                </Label>
                <Input
                  id={`${rowId}-trade-position`}
                  value={item.tradePositionNumber}
                  onChange={(e) => patch({ tradePositionNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${rowId}-supplier-esf`} className="text-xs text-text-muted">
                  Рег. номер ЭСФ поставщика из Перечня
                </Label>
                <Input
                  id={`${rowId}-supplier-esf`}
                  value={item.supplierEsfRegistrationNumber}
                  onChange={(e) => patch({ supplierEsfRegistrationNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor={`${rowId}-additional`} className="text-xs text-text-muted">
                  Дополнительные данные
                </Label>
                <Input
                  id={`${rowId}-additional`}
                  value={item.additionalData}
                  onChange={(e) => patch({ additionalData: e.target.value })}
                />
              </div>
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

export function EsfItemsTable({ items, onChange }: { items: EsfItem[]; onChange: (items: EsfItem[]) => void }) {
  function updateItem(index: number, item: EsfItem) {
    onChange(items.map((it, i) => (i === index ? item : it)));
  }
  function addItem() {
    onChange([...items, createEmptyItem()]);
  }
  function removeItem(index: number) {
    onChange(items.length > 1 ? items.filter((_, i) => i !== index) : items);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>№</TableHead>
              <TableHead>Наименование</TableHead>
              <TableHead>Ед.изм</TableHead>
              <TableHead className="text-right">Кол-во</TableHead>
              <TableHead className="text-right">Цена</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead>НДС</TableHead>
              <TableHead className="text-right">Сумма НДС</TableHead>
              <TableHead className="text-right">Итого</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <ItemRow
                key={index}
                item={item}
                index={index}
                onChange={(next) => updateItem(index, next)}
                onRemove={() => removeItem(index)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <Button type="button" variant="ghost" size="sm" className="gap-2 text-primary" onClick={addItem}>
        <Plus className="h-4 w-4" />
        Добавить позицию
      </Button>
    </div>
  );
}

export { computeItem };
