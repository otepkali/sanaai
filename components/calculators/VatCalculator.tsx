"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoneyInput } from "@/components/calculators/MoneyInput";
import { ResultBreakdown, type BreakdownRow } from "@/components/ResultBreakdown";
import { calculateVat, checkVatRegistrationThreshold, type VatMode } from "@/lib/vat";
import { vatFormSchema, vatThresholdFormSchema } from "@/lib/schemas";
import { formatPercent } from "@/lib/format";

const TAB_TRIGGER_CLASS =
  "rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm";

export function VatCalculator() {
  const [amount, setAmount] = useState(1_000_000);
  const [mode, setMode] = useState<VatMode>("exclusive");
  const [turnover, setTurnover] = useState(35_000_000);

  const amountValidation = vatFormSchema.safeParse({ amount, mode });
  const turnoverValidation = vatThresholdFormSchema.safeParse({ turnover });

  const result = useMemo(() => calculateVat({ amount, mode }), [amount, mode]);
  const threshold = useMemo(() => checkVatRegistrationThreshold(turnover), [turnover]);

  const rows: BreakdownRow[] = [
    { label: "Сумма без НДС", value: result.netAmount },
    { label: `НДС (${formatPercent(result.rate)})`, value: result.vatAmount },
    { label: "Сумма с НДС", value: result.grossAmount, bold: true },
  ];

  const thresholdBadge = threshold.isRegistrationRequired
    ? { text: "Требуется постановка на учёт по НДС", tone: "danger" as const }
    : threshold.usageRatio >= 0.9
      ? { text: "Близко к порогу постановки на учёт", tone: "warning" as const }
      : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-6">
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle>НДС</CardTitle>
            <CardDescription>Ставка 16% — выделение или начисление налога</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Tabs value={mode} onValueChange={(v) => setMode(v as VatMode)}>
              <TabsList className="w-full bg-surface-tint p-1">
                <TabsTrigger value="exclusive" className={`flex-1 ${TAB_TRIGGER_CLASS}`}>
                  Начислить сверху
                </TabsTrigger>
                <TabsTrigger value="inclusive" className={`flex-1 ${TAB_TRIGGER_CLASS}`}>
                  Выделить «в т.ч.»
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <MoneyInput
              label={mode === "exclusive" ? "Сумма без НДС" : "Сумма с НДС"}
              value={amount}
              onChange={setAmount}
              error={!amountValidation.success ? amountValidation.error.issues[0]?.message : undefined}
              hint={
                mode === "exclusive"
                  ? "НДС будет начислен сверх этой суммы"
                  : "НДС будет выделен из этой суммы"
              }
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Порог постановки на учёт</CardTitle>
            <CardDescription>10 000 МРП облагаемого оборота за год</CardDescription>
          </CardHeader>
          <CardContent>
            <MoneyInput
              label="Облагаемый оборот за год"
              value={turnover}
              onChange={setTurnover}
              error={
                !turnoverValidation.success
                  ? turnoverValidation.error.issues[0]?.message
                  : undefined
              }
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <ResultBreakdown title="Расчёт НДС" highlights={[{ label: "Сумма с НДС", value: result.grossAmount }]} rows={rows} />

        <ResultBreakdown
          title="Проверка порога постановки на учёт"
          highlights={[
            {
              label: "Оборот за год",
              value: threshold.turnover,
              sublabel: `${formatPercent(threshold.usageRatio, 0)} от порога постановки на учёт`,
            },
          ]}
          rows={[{ label: "Порог постановки на учёт (10 000 МРП)", value: threshold.threshold }]}
          badge={thresholdBadge}
        />
      </div>
    </div>
  );
}
