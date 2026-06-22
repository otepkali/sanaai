"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Scale } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyInput } from "@/components/calculators/MoneyInput";
import { ResultBreakdown, type BreakdownRow } from "@/components/ResultBreakdown";
import { compareTaxRegimes } from "@/lib/compare";
import { compareFormSchema } from "@/lib/schemas";
import { formatPercent, formatTenge } from "@/lib/format";

export function CompareCalculator() {
  const [annualRevenue, setAnnualRevenue] = useState(20_000_000);
  const [annualExpenses, setAnnualExpenses] = useState(8_000_000);
  const [annualPayroll, setAnnualPayroll] = useState(4_000_000);

  const validation = compareFormSchema.safeParse({
    annualRevenue,
    annualExpenses,
    annualPayroll,
  });

  const result = useMemo(
    () => compareTaxRegimes({ annualRevenue, annualExpenses, annualPayroll }),
    [annualRevenue, annualExpenses, annualPayroll]
  );

  const simplifiedRows: BreakdownRow[] = [
    { label: `Налог (${formatPercent(result.simplifiedRate)} × оборот)`, value: result.simplifiedTax, bold: true },
  ];

  const generalRows: BreakdownRow[] = [
    { label: "Прибыль (оборот − расходы − ФОТ)", value: result.generalProfit, tone: "muted" },
    { label: "ИПН (10% от прибыли)", value: result.generalIpn },
    { label: "Социальный налог (6% от ФОТ)", value: result.generalSocialTax },
    { label: "Итого налоговая нагрузка", value: result.generalTax, bold: true },
  ];

  const verdictLabel = result.isOverSimplifiedLimit
    ? "Доступен только ОУР"
    : result.cheaperRegime === "simplified"
      ? "Упрощёнка выгоднее"
      : result.cheaperRegime === "general"
        ? "ОУР (общий режим) выгоднее"
        : "Режимы дают одинаковую нагрузку";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle>Сравнение режимов</CardTitle>
            <CardDescription>Упрощёнка vs ОУР — годовые показатели</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <MoneyInput
              label="Годовой оборот"
              value={annualRevenue}
              onChange={setAnnualRevenue}
              error={!validation.success ? validation.error.issues[0]?.message : undefined}
            />
            <MoneyInput
              label="Примерные расходы (без ФОТ)"
              value={annualExpenses}
              onChange={setAnnualExpenses}
            />
            <MoneyInput label="ФОТ за год" value={annualPayroll} onChange={setAnnualPayroll} />
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-center rounded-2xl border-none bg-primary p-6 text-primary-foreground shadow-soft sm:p-8">
          <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground/80">
            <Scale className="h-4 w-4" />
            Вывод для клиента
          </div>
          <p className="font-tabular mt-2 text-3xl font-semibold sm:text-4xl">{verdictLabel}</p>
          {!result.isOverSimplifiedLimit && result.cheaperRegime !== "equal" ? (
            <p className="font-tabular mt-3 flex flex-wrap items-center gap-2 text-lg text-primary-foreground/90">
              Экономия {formatTenge(result.savingsAmount)} в год
              <span className="inline-flex items-center gap-1 text-primary-foreground/70">
                <ArrowRight className="h-4 w-4" />
                {formatPercent(result.savingsAmount / Math.max(annualRevenue, 1))} от оборота
              </span>
            </p>
          ) : null}
          {result.isOverSimplifiedLimit ? (
            <p className="mt-3 rounded-lg bg-white/15 px-3 py-2 text-sm">
              При таком обороте упрощёнка недоступна — превышен лимит 600 000 МРП в год (
              {formatTenge(result.simplifiedLimit)}). Остаётся только ОУР.
            </p>
          ) : null}
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <ResultBreakdown
          title="Упрощёнка (910)"
          highlights={[
            {
              label: "Налоговая нагрузка",
              value: result.simplifiedTax,
              sublabel: `${formatPercent(result.simplifiedBurdenRatio)} от оборота`,
            },
          ]}
          rows={simplifiedRows}
          badge={
            result.isOverSimplifiedLimit
              ? { text: "Превышен лимит 600 000 МРП", tone: "danger" }
              : undefined
          }
        />
        <ResultBreakdown
          title="ОУР (общий режим)"
          highlights={[
            {
              label: "Налоговая нагрузка",
              value: result.generalTax,
              sublabel: `${formatPercent(result.generalBurdenRatio)} от оборота`,
            },
          ]}
          rows={generalRows}
        />
      </div>
    </div>
  );
}
