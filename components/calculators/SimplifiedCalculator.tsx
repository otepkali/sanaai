"use client";

import { useId, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MoneyInput } from "@/components/calculators/MoneyInput";
import { ResultBreakdown, type BreakdownRow } from "@/components/ResultBreakdown";
import { calculateSimplifiedTax } from "@/lib/simplified";
import { simplifiedFormSchema } from "@/lib/schemas";
import { formatPercent, formatTenge } from "@/lib/format";
import { SIMPLIFIED_REGIONS, type SimplifiedRegionId } from "@/lib/tax-config-2026";

export function SimplifiedCalculator() {
  const employeeCountId = useId();
  const [halfYearIncome, setHalfYearIncome] = useState(10_000_000);
  const [regionId, setRegionId] = useState<SimplifiedRegionId>("default");
  const [employeeCount, setEmployeeCount] = useState(0);
  const [employeesHalfYearPayroll, setEmployeesHalfYearPayroll] = useState(0);

  const validation = simplifiedFormSchema.safeParse({
    halfYearIncome,
    regionId,
    employeeCount,
    employeesHalfYearPayroll,
  });

  const result = useMemo(
    () =>
      calculateSimplifiedTax({
        halfYearIncome,
        regionId,
        employeeCount,
        employeesHalfYearPayroll,
      }),
    [halfYearIncome, regionId, employeeCount, employeesHalfYearPayroll]
  );

  const rows: BreakdownRow[] = [
    {
      label: `Налог до льготы (${formatPercent(result.rate)} × доход)`,
      value: result.taxBeforeDiscount,
    },
  ];

  if (employeeCount > 0) {
    rows.push({
      label: "Льгота за работников",
      value: -result.discountAmount,
      tone: result.discountAmount > 0 ? "success" : "muted",
      hint: result.isEmployeeDiscountEligible
        ? `1,5% × ${result.qualifyingEmployees} раб. — средняя ЗП ${formatTenge(result.averageMonthlyEmployeeSalary)}/мес ≥ 25 МРП`
        : `Не применяется — средняя ЗП ${formatTenge(result.averageMonthlyEmployeeSalary)}/мес ниже 25 МРП (${formatTenge(25 * 4325)})`,
    });
  }

  rows.push({ label: "Налог к уплате", value: result.tax, bold: true });

  const limitBadge =
    result.limitUsageRatio >= 1
      ? { text: "Превышен лимит 600 000 МРП", tone: "danger" as const }
      : result.limitUsageRatio >= 0.9
        ? { text: "Близко к лимиту 600 000 МРП", tone: "warning" as const }
        : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle>Упрощённая декларация</CardTitle>
          <CardDescription>Форма 910 — расчёт за полугодие</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <MoneyInput
            label="Доход за полугодие"
            value={halfYearIncome}
            onChange={setHalfYearIncome}
            error={!validation.success ? validation.error.issues[0]?.message : undefined}
          />

          <div className="space-y-1.5">
            <Label className="text-sm text-text-muted">Регион (ставка маслихата)</Label>
            <Select value={regionId} onValueChange={(v) => setRegionId(v as SimplifiedRegionId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIMPLIFIED_REGIONS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label} — {formatPercent(r.rate)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-text-muted">
              Список и ставки маслихатов ориентировочные, уточняйте в своём акимате.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={employeeCountId} className="text-sm text-text-muted">
              Число работников
            </Label>
            <Input
              id={employeeCountId}
              type="number"
              min={0}
              inputMode="numeric"
              value={employeeCount || ""}
              onChange={(e) => setEmployeeCount(Math.max(0, Number(e.target.value) || 0))}
              placeholder="0"
              className="font-tabular"
            />
          </div>

          <MoneyInput
            label="ФОТ работников за полугодие"
            value={employeesHalfYearPayroll}
            onChange={setEmployeesHalfYearPayroll}
            hint="Суммарно начислено всем работникам за те же 6 месяцев"
          />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <ResultBreakdown
          title="Расчёт по форме 910"
          highlights={[
            { label: "Налог к уплате", value: result.tax },
            {
              label: "Оценка годового дохода",
              value: result.annualIncomeEstimate,
              sublabel: `${formatPercent(result.limitUsageRatio, 0)} от лимита 600 000 МРП`,
            },
          ]}
          rows={rows}
          badge={limitBadge}
        />

        <Alert className="border-border bg-surface-tint">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-text-muted">
            На упрощённой декларации в 2026 году НДС и социальный налог для ИП не уплачиваются.
            Декларация подаётся дважды в год — по итогам каждого полугодия.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
