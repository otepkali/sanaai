"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoneyInput } from "@/components/calculators/MoneyInput";
import { ResultBreakdown, type BreakdownRow } from "@/components/ResultBreakdown";
import {
  calculateVat,
  calculateVatSettlement,
  checkVatRegistrationThreshold,
  type VatMode,
} from "@/lib/vat";
import { vatFormSchema, vatThresholdFormSchema } from "@/lib/schemas";
import { formatPercent, formatTenge } from "@/lib/format";
import { useAutosaveCalculation } from "@/lib/hooks/useAutosaveCalculation";
import type { CalculationRow } from "@/lib/supabase/calculations";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import type { ReportData } from "@/lib/reports/types";

const TAB_TRIGGER_CLASS =
  "rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm";

interface VatSavedInput {
  amount: number;
  mode: VatMode;
  turnover: number;
  inputVat: number;
  outputVat: number;
}

export interface VatCalculatorProps {
  initialData?: CalculationRow;
  onSaved?: () => void;
}

export function VatCalculator({ initialData, onSaved }: VatCalculatorProps) {
  const initialInput = initialData?.input as VatSavedInput | undefined;

  const [amount, setAmount] = useState(initialInput?.amount ?? 1_000_000);
  const [mode, setMode] = useState<VatMode>(initialInput?.mode ?? "exclusive");
  const [turnover, setTurnover] = useState(initialInput?.turnover ?? 35_000_000);
  const [inputVat, setInputVat] = useState(initialInput?.inputVat ?? 0);
  const [outputVat, setOutputVat] = useState(initialInput?.outputVat ?? 0);

  const amountValidation = vatFormSchema.safeParse({ amount, mode });
  const turnoverValidation = vatThresholdFormSchema.safeParse({ turnover });

  const result = calculateVat({ amount, mode });
  const threshold = checkVatRegistrationThreshold(turnover);
  const settlement = calculateVatSettlement({ inputVat, outputVat });

  useAutosaveCalculation(
    "vat",
    { amount, mode, turnover, inputVat, outputVat },
    { result, threshold, settlement },
    { initialId: initialData?.id, onSaved }
  );

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

  const settlementRows: BreakdownRow[] = [
    { label: "Входящий НДС (к зачёту)", value: settlement.inputVat },
    { label: "Исходящий НДС (с реализации)", value: settlement.outputVat },
    {
      label: settlement.isRefund ? "НДС к возврату" : "НДС к уплате в бюджет",
      value: Math.abs(settlement.netVat),
      bold: true,
      tone: settlement.isRefund ? "success" : "default",
    },
  ];

  const reportData: ReportData = {
    type: "vat",
    title: "НДС",
    date: new Date().toISOString().slice(0, 10),
    inputs: [
      { label: mode === "exclusive" ? "Сумма без НДС" : "Сумма с НДС", value: formatTenge(amount) },
      { label: "Облагаемый оборот за год", value: formatTenge(turnover) },
      { label: "Входящий НДС", value: formatTenge(inputVat) },
      { label: "Исходящий НДС", value: formatTenge(outputVat) },
    ],
    rows: [
      { label: "Сумма без НДС", value: formatTenge(result.netAmount) },
      { label: `НДС (${formatPercent(result.rate)})`, value: formatTenge(result.vatAmount) },
      { label: "Сумма с НДС", value: formatTenge(result.grossAmount), bold: true },
      {
        label: settlement.isRefund ? "НДС к возврату" : "НДС к уплате в бюджет",
        value: formatTenge(Math.abs(settlement.netVat)),
        bold: true,
      },
    ],
  };

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
                  Выделить «в т.ч.» (обратный расчёт)
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

        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">НДС к возврату</CardTitle>
            <CardDescription>Зачёт входящего НДС против исходящего за период</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <MoneyInput
              label="Входящий НДС (по покупкам)"
              value={inputVat}
              onChange={setInputVat}
            />
            <MoneyInput
              label="Исходящий НДС (по продажам)"
              value={outputVat}
              onChange={setOutputVat}
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

        <ResultBreakdown
          title="НДС к возврату / доплате"
          highlights={[
            {
              label: settlement.isRefund ? "К возврату из бюджета" : "К уплате в бюджет",
              value: Math.abs(settlement.netVat),
              sublabel: settlement.isRefund
                ? "Входящий НДС превышает исходящий"
                : "Исходящий НДС превышает входящий (или равен ему)",
            },
          ]}
          rows={settlementRows}
          badge={
            settlement.isRefund
              ? { text: "Сумма к возврату", tone: "success" }
              : undefined
          }
        />

        <DownloadPdfButton data={reportData} />
      </div>
    </div>
  );
}
